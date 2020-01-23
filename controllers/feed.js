const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const Post = require("../models/post");
const User = require("../models/user");

const handleError = error => {
  if (!err.statusCode) {
    err.statusCode = 500;
  }
  next(err);
};

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .populate("creator");
    res.status(200).json({
      message: "Posts fetched",
      posts: posts,
      totalItems: totalItems
    });
  } catch (err) {
    handleError(err);
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;

    throw error;
  }

  if (!req.file) {
    const error = new Error("No image found");
    error.statusCode = 422;
    throw error;
  }

  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;
  const userId = req.userId;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });

  try {
    await post.save();
    const user = await User.findById(userId);
    user.posts.push(post);
    await user.save();

    res.status(201).json({
      message: "Post created successfully!",
      post: post,
      creator: { _id: user._id, name: user.name }
    });
  } catch (err) {
    handleError(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = await await Post.findById(postId).populate("creator");
    if (!post) {
      const error = new Error("Unable to find post");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched", post: post });
  } catch (err) {
    handleError(err);
  }
};

exports.updatePost = async (req, res, next) => {
  const postId = req.params.postId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;

    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!imageUrl) {
    const error = new Error("No file selected");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      const error = new Error("Unable to find post");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized.");
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    const result = await post.save();

    res.status(200).json({ message: "Post updated!", post: result });
  } catch (err) {
    handleError(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  try {
    const post = Post.findById(postId);

    if (!post) {
      const error = new Error("Unable to find post");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized.");
      error.statusCode = 403;
      throw error;
    }

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();

    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    handleError(err);
  }
};

const clearImage = filePath => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, err => console.log(err));
};
