export interface ForumPost {
  id: string;
  authorId: string;
  title: string;
  content: string;
  images?: string[];
  likesCount: number;
  commentsCount: number;
  isAnnouncement: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: Date;
}
