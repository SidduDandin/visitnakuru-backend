import express, { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient();
const router = express.Router();

// Helper type for creating/updating blog
type BlogInput = {
  title: string;
  content: string;
  author: string;
  tags?: string[]; // optional
  featuredImage?: string;
};

// Create blog
router.post("/", async (req: Request, res: Response) => {
  try {
    const { title, content, author, tags, featuredImage }: BlogInput = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: "title, content, and author are required" });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        author,
        tags: tags || [],
        featuredImage,
      },
    });

    res.status(201).json(blog);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get all blogs
router.get("/", async (_req: Request, res: Response) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(blogs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog
router.get("/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid blog ID" });

  const blog = await prisma.blog.findUnique({ where: { id } });
  if (!blog) return res.status(404).json({ error: "Blog not found" });

  res.json(blog);
});

// Update blog
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid blog ID" });

    const { title, content, author, tags, featuredImage }: BlogInput = req.body;

    const blog = await prisma.blog.update({
      where: { id },
      data: {
        title,
        content,
        author,
        tags: tags || [],
        featuredImage,
      },
    });

    res.json(blog);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete blog
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid blog ID" });

    await prisma.blog.delete({ where: { id } });
    res.json({ message: "Blog deleted" });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
