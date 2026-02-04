# **ResuRalph Platform**

### The web-based annotation interface for ResuRalph

This is the frontend companion to [ResuRalph](https://github.com/lennartschaeffer/resuralph-python), a Discord bot I built for collaborative resume reviewing. While the bot provides the entry point for users to submit their resumes, this platform is where the actual reviewing happens.

## **How It Connects**

1. A user uploads their resume PDF via Discord using the `/upload` command
2. The bot stores the PDF in S3 and creates a document record
3. The bot returns a link to this platform where reviewers can view and annotate the resume
4. Annotations are stored in PostgreSQL and can be fetched back into Discord via `/get_annotations`

## **Features**

- **PDF Viewing**: Renders resumes directly in the browser using react-pdf
- **Inline Annotations**: Reviewers select text and leave comments with optional priority flags
- **Discord OAuth**: Authenticated users can create, edit, and delete their annotations
- **Public Access**: Anyone with a link can view the resume and existing annotations without signing in

## **Tech Stack**

- **Next.js 16** (App Router) with React 19 and TypeScript
- **Tailwind CSS 4** for styling
- **Supabase Auth** with Discord OAuth
- **Prisma ORM** with PostgreSQL
- **AWS S3** for PDF storage (shared with resuralph-python)
- **react-pdf** for document rendering

## **Architecture**

The viewer lives at `/view/[documentId]`. When loaded, it fetches a signed S3 URL and renders the PDF. A text selection layer captures highlighted text and converts browser coordinates to PDF points for storage. An overlay layer does the reverse, rendering stored annotations at the correct positions regardless of zoom level.

Annotations store their positions in PDF coordinate space, making them resolution-independent. The coordinate conversion happens in `TextSelectionLayer` (browser to PDF) and `AnnotationOverlay` (PDF to browser).
