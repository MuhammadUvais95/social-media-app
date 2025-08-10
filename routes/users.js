// routes/users.js
const express = require('express');
const { User, Follow, Post } = require('../models');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// get public profile by id
router.get('/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id, { attributes: ['id','username','bio','avatarUrl'] });
  if (!user) return res.status(404).json({ error: 'Not found' });
  const followingCount = await user.countFollowing();
  const followerCount = await user.countFollowers();
  const posts = await Post.findAll({ where: { userId: user.id }, order: [['createdAt','DESC']]});
  res.json({ user, followingCount, followerCount, posts });
});

// follow/unfollow
router.post('/:id/follow', authenticate, async (req, res) => {
  const targetId = parseInt(req.params.id,10);
  if (req.user.id === targetId) return res.status(400).json({ error: "Can't follow yourself" });
  const target = await User.findByPk(targetId);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const already = await target.hasFollowers(req.user);
  if (already) {
    // unfollow
    await target.removeFollowers(req.user);
    return res.json({ following: false });
  } else {
    await target.addFollowers(req.user);
    return res.json({ following: true });
  }
});

module.exports = router;
