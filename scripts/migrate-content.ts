/**
 * Bulk migration script: Markdown → TipTap JSON
 *
 * Converts all existing markdown posts to TipTap JSON format.
 *
 * Usage:
 *   npx ts-node --esm migrate-content.ts              # Run migration
 *   npx ts-node --esm migrate-content.ts --dry-run     # Preview without changes
 *   npx ts-node --esm migrate-content.ts --post-id <uuid>  # Migrate single post
 *
 * Requires DATABASE_URL environment variable.
 */

import pg from "pg";
import { marked } from "marked";
import { generateJSON } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Youtube from "@tiptap/extension-youtube";
import { common, createLowlight } from "lowlight";

const { Pool } = pg;
const lowlight = createLowlight(common);

const extensions = [
  StarterKit.configure({ codeBlock: false, horizontalRule: false }),
  Image,
  Link,
  Underline,
  CodeBlockLowlight.configure({ lowlight }),
  HorizontalRule,
  Youtube,
];

// --- CLI Args ---
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const postIdIdx = args.indexOf("--post-id");
const singlePostId = postIdIdx !== -1 ? args[postIdIdx + 1] : null;

// --- Helpers ---

function extractTextFromTipTap(doc: any): string {
  const parts: string[] = [];

  function walk(node: any) {
    if (node.text) {
      parts.push(node.text);
    }
    if (node.content) {
      for (const child of node.content) {
        walk(child);
      }
    }
    const blockTypes = [
      "paragraph",
      "heading",
      "blockquote",
      "codeBlock",
      "bulletList",
      "orderedList",
      "listItem",
      "horizontalRule",
    ];
    if (node.type && blockTypes.includes(node.type)) {
      parts.push("\n\n");
    }
  }

  walk(doc);
  return parts.join("").trim();
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // Fetch posts to migrate
    let query = "SELECT id, title, content FROM posts WHERE content_format = 'markdown'";
    const params: any[] = [];

    if (singlePostId) {
      query += " AND id = $1";
      params.push(singlePostId);
    }

    query += " ORDER BY created_at ASC";

    const { rows: posts } = await pool.query(query, params);

    console.log(`Found ${posts.length} markdown posts to migrate`);
    if (dryRun) {
      console.log("DRY RUN - no changes will be made\n");
    }

    const BATCH_SIZE = 50;
    let migrated = 0;
    let failed = 0;

    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE);

      for (const post of batch) {
        try {
          // Step 1: Markdown → HTML
          const html = await marked.parse(post.content || "", { async: false });

          // Step 2: HTML → TipTap JSON
          const json = generateJSON(html as string, extensions);

          // Step 3: Extract plain text from JSON
          const plainText = extractTextFromTipTap(json);

          if (dryRun) {
            console.log(`[DRY RUN] Post "${post.title}" (${post.id})`);
            console.log(`  Content length: ${post.content?.length || 0} chars`);
            console.log(`  JSON nodes: ${json.content?.length || 0}`);
            console.log(`  Plain text: ${plainText.length} chars`);
            console.log();
          } else {
            await pool.query(
              `UPDATE posts SET content_json = $1, content = $2, content_format = 'tiptap' WHERE id = $3`,
              [JSON.stringify(json), plainText, post.id]
            );
          }

          migrated++;
        } catch (err: any) {
          console.error(`FAILED: Post "${post.title}" (${post.id}): ${err.message}`);
          failed++;
        }
      }

      console.log(`Progress: ${Math.min(i + BATCH_SIZE, posts.length)}/${posts.length} processed`);
    }

    console.log(`\nMigration complete:`);
    console.log(`  Migrated: ${migrated}`);
    console.log(`  Failed: ${failed}`);
    if (dryRun) {
      console.log(`  (DRY RUN - no changes were made)`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
