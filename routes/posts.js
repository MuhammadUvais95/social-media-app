// routes/posts.js
const express = require('express');
const { Post, User, Comment, Like } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// create post
router.post('/', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  const post = await Post.create({ content, userId: req.user.id });
  res.json(post);
});

// feed: simple — recent posts with user and likes & comments
router.get('/', async (req, res) => {
  const posts = await Post.findAll({
    order: [['createdAt','DESC']],
    include: [
      { model: User, attributes: ['id','username','avatarUrl'] },
      { model: Comment, include: [{ model: User, attributes: ['id','username'] }] },
      { model: User, as: 'Likers', attributes: ['id','username'] }
    ]
  });
  // map to a simpler shape
  const out = posts.map(p => ({
    id: p.id,
    content: p.content,
    createdAt: p.createdAt,
    user: p.User,
    comments: p.Comments.map(c => ({ id: c.id, content: c.content, user: c.User, createdAt: c.createdAt })),
    likesCount: p.Likers ? p.Likers.length : 0,
    likers: p.Likers ? p.Likers.map(u => ({ id: u.id, username: u.username })) : []
  }));
  res.json(out);
});

// comment on post
router.post('/:id/comments', authenticate, async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Missing content' });
  const post = await Post.findByPk(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const comment = await Comment.create({ content, postId, userId: req.user.id });
  res.json(comment);
});

// like/unlike post
router.post('/:id/like', authenticate, async (req, res) => {
  const postId = req.params.id;
  const post = await Post.findByPk(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const already = await post.hasLikers(req.user);
  if (already) {
    await post.removeLikers(req.user);
    return res.json({ liked: false });
  } else {
    await post.addLikers(req.user);
    return res.json({ liked: true });
  }
});

module.exports = router;
