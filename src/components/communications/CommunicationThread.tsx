import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Paperclip, Send, File, UploadCloud } from 'lucide-react';
import { Communication, User } from '../../types';
import Button from '../common/Button';

interface CommunicationThreadProps {
  communications: Communication[];
  currentUser: User;
  ticketId: string;
  onSendMessage: (message: string, files: File[]) => Promise<void>;
  isLoading?: boolean;
}

const CommunicationThread: React.FC<CommunicationThreadProps> = ({
  communications,
  currentUser,
  ticketId,
  onSendMessage,
  isLoading = false,
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const simulateFileUpload = () => {
    if (files.length === 0) return Promise.resolve();
    
    setIsUploading(true);
    setUploadProgress(0);
    
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsUploading(false);
              resolve();
            }, 500);
            return 100;
          }
          return newProgress;
        });
      }, 300);
    });
  };

  const handleSendMessage = async () => {
    if (!message.trim() && files.length === 0) return;
    
    try {
      if (files.length > 0) {
        await simulateFileUpload();
      }
      
      await onSendMessage(message, files);
      setMessage('');
      setFiles([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const isCurrentUser = (userId: string) => {
    return userId === currentUser.id;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {communications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <UploadCloud className="mb-3 h-12 w-12 text-gray-600" />
            <p className="text-lg font-medium">No communications yet</p>
            <p className="mt-1">Be the first to add a comment to this ticket</p>
          </div>
        ) : (
          <div className="space-y-6">
            {communications.map((comm) => (
              <div
                key={comm.id}
                className={`flex ${
                  isCurrentUser(comm.userId) ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-lg p-4 max-w-[80%] ${
                    isCurrentUser(comm.userId)
                      ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                      : 'bg-black/20 text-gray-200'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">
                      {isCurrentUser(comm.userId)
                        ? 'You'
                        : `${comm.user.firstName} ${comm.user.lastName}`}
                    </span>
                    <span className="ml-2 text-xs opacity-70">
                      {formatDistanceToNow(new Date(comm.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  
                  <p className="whitespace-pre-wrap">{comm.message}</p>
                  
                  {comm.attachments && comm.attachments.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium">Attachments:</div>
                      <div className="mt-2 space-y-2">
                        {comm.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center rounded border border-gray-700/50 bg-black/20 p-2 text-sm hover:bg-black/30"
                          >
                            <File className="mr-2 h-4 w-4" />
                            <span className="flex-1 truncate">{attachment.name}</span>
                            <span className="ml-2 text-xs text-gray-400">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-700/50 bg-[#00080A] p-4">
        {files.length > 0 && (
          <div className="mb-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center rounded-md border border-gray-700/50 bg-black/20 p-2 text-sm"
              >
                <File className="mr-2 h-4 w-4 text-gray-400" />
                <span className="flex-1 truncate text-gray-200">{file.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="ml-2 text-gray-500 hover:text-gray-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
            
            {isUploading && (
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-gray-300">Uploading...</span>
                  <span className="text-gray-300">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/20">
                  <div
                    className="h-full bg-primary transition-all duration-300 dark:bg-primary-light"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="flex items-end space-x-2">
          <div className="relative flex-1">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="input min-h-[80px] resize-none py-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-full p-2 text-gray-400 hover:bg-black/20">
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.csv,.xls,.xlsx"
              />
            </label>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={(!message.trim() && files.length === 0) || isLoading || isUploading}
            loading={isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationThread;