package service

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/nowbind/nowbind/internal/config"
)

// emailProvider is the internal interface each sending backend implements.
type emailProvider interface {
	send(from, to, subject, htmlBody string) error
}

// EmailService is the public facade; callers only use IsEnabled() and SendMagicLinkEmail().
type EmailService struct {
	sender   string
	enabled  bool
	logoData []byte // PNG logo bytes (used by Gmail for inline CID embedding)
	provider emailProvider
}

func NewEmailService(cfg *config.Config) *EmailService {
	svc := &EmailService{
		sender: cfg.EmailSender,
	}

	// Load logo (used by the Gmail MIME builder)
	svc.loadLogo()

	switch strings.ToLower(cfg.EmailProvider) {
	case "ses":
		if cfg.EmailSender == "" || cfg.AWSAccessKeyID == "" || cfg.AWSSecretAccessKey == "" {
			log.Println("Email service disabled: EMAIL_PROVIDER=ses requires EMAIL_SENDER, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY")
			return svc
		}
		p, err := newSESProvider(cfg.AWSAccessKeyID, cfg.AWSSecretAccessKey, cfg.AWSRegion)
		if err != nil {
			log.Printf("Email service disabled: failed to create SES provider: %v", err)
			return svc
		}
		svc.provider = p
		svc.enabled = true
		log.Printf("Email service enabled via AWS SES (region: %s, sender: %s)", cfg.AWSRegion, cfg.EmailSender)
	default: // "gmail"
		if cfg.EmailSender == "" || cfg.GmailRefreshToken == "" {
			log.Println("Email service disabled: missing EMAIL_SENDER or GMAIL_REFRESH_TOKEN")
			return svc
		}
		svc.provider = &gmailProvider{
			clientID:     cfg.GmailClientID,
			clientSecret: cfg.GmailClientSecret,
			refreshToken: cfg.GmailRefreshToken,
			logoData:     svc.logoData,
		}
		svc.enabled = true
		log.Printf("Email service enabled via Gmail (sender: %s)", cfg.EmailSender)
	}

	return svc
}

func (s *EmailService) loadLogo() {
	paths := []string{
		"assets/logo-dark.png",
		"../assets/logo-dark.png",
	}

	_, filename, _, ok := runtime.Caller(0)
	if ok {
		dir := filepath.Dir(filename)
		paths = append(paths,
			filepath.Join(dir, "../../assets/logo-dark.png"),
			filepath.Join(dir, "../../../assets/logo-dark.png"),
		)
	}

	for _, p := range paths {
		data, err := os.ReadFile(p)
		if err == nil {
			s.logoData = data
			log.Printf("Loaded email logo from %s (%d bytes)", p, len(data))
			return
		}
	}

	log.Println("Warning: could not load email logo, emails will use text fallback")
}

func (s *EmailService) IsEnabled() bool {
	return s.enabled
}

func (s *EmailService) SendMagicLinkEmail(toEmail, magicLinkURL string) error {
	if !s.enabled {
		log.Printf("[email-disabled] Magic link for %s: %s", toEmail, magicLinkURL)
		return nil
	}

	subject := "Sign in to NowBind"
	htmlBody := buildMagicLinkHTML(magicLinkURL)

	if err := s.provider.send(s.sender, toEmail, subject, htmlBody); err != nil {
		return fmt.Errorf("sending magic link email: %w", err)
	}

	log.Printf("Magic link email sent to %s", toEmail)
	return nil
}

// buildMagicLinkHTML returns the HTML body for the magic-link email.
// SES receives this as-is (hosted image URL). Gmail swaps the img src to cid:logo when logo bytes are available.
func buildMagicLinkHTML(magicLinkURL string) string {
	logoHTML := `<img src="https://nowbind.com/logos/icon-192.png" alt="NowBind" width="48" height="48" style="width: 48px; height: 48px; border-radius: 10px; display: block;">`
	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; max-width: 480px;">
          <tr><td align="center" style="padding: 40px 40px 24px;">%s</td></tr>
          <tr>
            <td align="center" style="padding: 0 40px;">
              <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px;">Sign in to NowBind</h2>
              <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 0 0 28px;">Click the button below to sign in to your account. This link expires in 15 minutes.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 32px;">
              <a href="%s" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 14px;">Sign in to NowBind</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 40px 40px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; line-height: 1.5; margin: 0;">If you did not request this email, you can safely ignore it.<br>This link will expire in 15 minutes.</p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width: 480px;">
          <tr><td align="center" style="padding: 24px 0;"><p style="font-size: 11px; color: #bbb; margin: 0;">NowBind &mdash; Write for humans. Feed the machines.</p></td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, logoHTML, magicLinkURL)
}

// gmailProvider sends email via the Gmail REST API using OAuth2.
type gmailProvider struct {
	clientID     string
	clientSecret string
	refreshToken string
	logoData     []byte
}

func (g *gmailProvider) send(from, to, subject, htmlBody string) error {
	// Replace the hosted URL logo with CID inline image when logo bytes are available
	if len(g.logoData) > 0 {
		htmlBody = strings.ReplaceAll(htmlBody,
			`src="https://nowbind.com/logos/icon-192.png"`,
			`src="cid:logo"`,
		)
	}

	accessToken, err := g.getAccessToken()
	if err != nil {
		return fmt.Errorf("getting gmail access token: %w", err)
	}

	msg := g.buildMIMEMessage(from, to, subject, htmlBody)
	if err := g.sendViaGmailAPI(accessToken, msg); err != nil {
		return fmt.Errorf("sending via gmail api: %w", err)
	}
	return nil
}

func (g *gmailProvider) getAccessToken() (string, error) {
	body := fmt.Sprintf(
		"client_id=%s&client_secret=%s&refresh_token=%s&grant_type=refresh_token",
		g.clientID, g.clientSecret, g.refreshToken,
	)

	resp, err := http.Post(
		"https://oauth2.googleapis.com/token",
		"application/x-www-form-urlencoded",
		strings.NewReader(body),
	)
	if err != nil {
		return "", fmt.Errorf("requesting access token: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("reading token response: %w", err)
	}

	var result struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
		ErrorDesc   string `json:"error_description"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("parsing token response: %w", err)
	}
	if result.Error != "" {
		return "", fmt.Errorf("oauth error: %s - %s", result.Error, result.ErrorDesc)
	}
	return result.AccessToken, nil
}

func (g *gmailProvider) buildMIMEMessage(from, to, subject, htmlBody string) []byte {
	boundary := "----=_NowBind_Boundary_001"
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("From: NowBind <%s>\r\n", from))
	sb.WriteString(fmt.Sprintf("To: %s\r\n", to))
	sb.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	sb.WriteString("MIME-Version: 1.0\r\n")

	if len(g.logoData) > 0 {
		sb.WriteString(fmt.Sprintf("Content-Type: multipart/related; boundary=\"%s\"\r\n", boundary))
		sb.WriteString("\r\n")

		sb.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		sb.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
		sb.WriteString("Content-Transfer-Encoding: 7bit\r\n")
		sb.WriteString("\r\n")
		sb.WriteString(htmlBody)
		sb.WriteString("\r\n")

		sb.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		sb.WriteString("Content-Type: image/png; name=\"logo.png\"\r\n")
		sb.WriteString("Content-Transfer-Encoding: base64\r\n")
		sb.WriteString("Content-Disposition: inline; filename=\"logo.png\"\r\n")
		sb.WriteString("Content-ID: <logo>\r\n")
		sb.WriteString("\r\n")

		encoded := base64.StdEncoding.EncodeToString(g.logoData)
		for i := 0; i < len(encoded); i += 76 {
			end := i + 76
			if end > len(encoded) {
				end = len(encoded)
			}
			sb.WriteString(encoded[i:end])
			sb.WriteString("\r\n")
		}
		sb.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	} else {
		sb.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
		sb.WriteString("\r\n")
		sb.WriteString(htmlBody)
	}

	return []byte(sb.String())
}

func (g *gmailProvider) sendViaGmailAPI(accessToken string, rawMessage []byte) error {
	encoded := base64.URLEncoding.EncodeToString(rawMessage)
	encoded = strings.TrimRight(encoded, "=")

	payload := fmt.Sprintf(`{"raw":"%s"}`, encoded)

	req, err := http.NewRequest("POST",
		"https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
		strings.NewReader(payload))
	if err != nil {
		return fmt.Errorf("creating gmail api request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("gmail api request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("gmail api error %d: %s", resp.StatusCode, string(body))
	}
	return nil
}

// xoauth2Auth implements smtp.Auth for XOAUTH2 (kept for potential future SMTP use).
type xoauth2Auth struct {
	user        string
	accessToken string
}

func newXOAuth2Auth(user, accessToken string) smtp.Auth {
	return &xoauth2Auth{user: user, accessToken: accessToken}
}

func (a *xoauth2Auth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	response := fmt.Sprintf("user=%s\x01auth=Bearer %s\x01\x01", a.user, a.accessToken)
	return "XOAUTH2", []byte(response), nil
}

func (a *xoauth2Auth) Next(fromServer []byte, more bool) ([]byte, error) {
	if more {
		return nil, fmt.Errorf("xoauth2 unexpected challenge: %s", fromServer)
	}
	return nil, nil
}
