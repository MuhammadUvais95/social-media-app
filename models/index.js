// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'database.sqlite' });

// models
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  bio: { type: DataTypes.TEXT, allowNull: true },
  avatarUrl: { type: DataTypes.STRING, allowNull: true }
});

const Post = sequelize.define('Post', {
  content: { type: DataTypes.TEXT, allowNull: false }
});

const Comment = sequelize.define('Comment', {
  content: { type: DataTypes.TEXT, allowNull: false }
});

const Follow = sequelize.define('Follow', {}, { timestamps: false }); // join table
const Like = sequelize.define('Like', {}, { timestamps: false });   // join table

// associations
User.hasMany(Post, { foreignKey: 'userId', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Comment, { foreignKey: 'userId', onDelete: 'CASCADE' });
Comment.belongsTo(User, { foreignKey: 'userId' });

Post.hasMany(Comment, { foreignKey: 'postId', onDelete: 'CASCADE' });
Comment.belongsTo(Post, { foreignKey: 'postId' });

// follows: user -> user (follower -> following)
User.belongsToMany(User, { through: Follow, as: 'Followers', foreignKey: 'followingId', otherKey: 'followerId' });
User.belongsToMany(User, { through: Follow, as: 'Following', foreignKey: 'followerId', otherKey: 'followingId' });

// likes: users <-> posts
User.belongsToMany(Post, { through: Like, as: 'LikedPosts', foreignKey: 'userId' });
Post.belongsToMany(User, { through: Like, as: 'Likers', foreignKey: 'postId' });

module.exports = { sequelize, User, Post, Comment, Follow, Like };
