export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  emailLower: string;
  about: string;
  photoURL: string | null;
  online: boolean;
  lastSeen: number | null; // ms
};

export type MessageType = 'text' | 'image' | 'file' | 'audio';

export type ReplyRef = {
  id: string;
  senderId: string;
  preview: string;
};

export type Message = {
  id: string;
  senderId: string;
  type: MessageType;
  text: string;
  mediaUrl: string | null;
  mediaPath: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  duration: number | null; // saniye
  replyTo: ReplyRef | null;
  createdAt: number; // ms
  editedAt: number | null;
  deleted: boolean;
  pending: boolean; // henüz sunucuya ulaşmadı
};

export type LastMessage = {
  text: string;
  type: MessageType;
  senderId: string;
  createdAt: number;
};

export type Chat = {
  id: string;
  type: 'direct' | 'group';
  members: string[];
  admins: string[];
  name: string | null; // yalnızca gruplar
  photoURL: string | null; // yalnızca gruplar
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  lastMessage: LastMessage | null;
  unread: Record<string, number>;
  lastRead: Record<string, number>;
  typing: Record<string, number>;
};
