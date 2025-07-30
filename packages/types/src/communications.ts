export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
}

export interface Communication {
  id: string;
  ticketId: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  message: string;
  attachments: Attachment[];
  createdAt: string;
}
