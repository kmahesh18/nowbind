package service

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sesv2/types"
)

// sesProvider sends email via AWS SES v2 using static IAM credentials.
type sesProvider struct {
	client *sesv2.Client
}

func newSESProvider(accessKeyID, secretAccessKey, region string) (*sesProvider, error) {
	if region == "" {
		region = "ap-south-1"
	}

	creds := aws.NewCredentialsCache(
		credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, ""),
	)

	client := sesv2.New(sesv2.Options{
		Region:      region,
		Credentials: creds,
	})

	log.Printf("SES provider created (region: %s)", region)
	return &sesProvider{client: client}, nil
}

func (p *sesProvider) send(from, to, subject, htmlBody string) error {
	input := &sesv2.SendEmailInput{
		FromEmailAddress: aws.String(fmt.Sprintf("NowBind <%s>", from)),
		Destination: &types.Destination{
			ToAddresses: []string{to},
		},
		Content: &types.EmailContent{
			Simple: &types.Message{
				Subject: &types.Content{
					Data:    aws.String(subject),
					Charset: aws.String("UTF-8"),
				},
				Body: &types.Body{
					Html: &types.Content{
						Data:    aws.String(htmlBody),
						Charset: aws.String("UTF-8"),
					},
				},
			},
		},
	}

	out, err := p.client.SendEmail(context.Background(), input)
	if err != nil {
		return fmt.Errorf("ses send email: %w", err)
	}

	log.Printf("SES email sent, message ID: %s", aws.ToString(out.MessageId))
	return nil
}
