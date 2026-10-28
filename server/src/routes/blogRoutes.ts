import { Router } from 'express';
import { blogController } from '../controllers/blogController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Public Blog
router.get('/posts', blogController.getPosts);
router.get('/posts/:slug', blogController.getPostBySlug);
router.get('/categories', blogController.getCategories);
router.get('/authors', blogController.getAuthors);

// Admin Blog - Posts
router.get('/admin/posts', requireAdmin, blogController.getPosts);
router.post('/admin/posts', requireAdmin, blogController.createPost);
router.put('/admin/posts/:id', requireAdmin, blogController.updatePost);
router.delete('/admin/posts/:id', requireAdmin, blogController.deletePost);

// Admin Blog - Categories
router.post('/admin/categories', requireAdmin, blogController.createCategory);
router.put('/admin/categories/:id', requireAdmin, blogController.updateCategory);
router.delete('/admin/categories/:id', requireAdmin, blogController.deleteCategory);

// Admin Blog - Authors
router.post('/admin/authors', requireAdmin, blogController.createAuthor);
router.put('/admin/authors/:id', requireAdmin, blogController.updateAuthor);
router.delete('/admin/authors/:id', requireAdmin, blogController.deleteAuthor);

export default router;
