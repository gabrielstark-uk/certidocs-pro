import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { UploadedFile, EXHIBIT_LABELS } from '@/types/certification';
import { computeFileHash, formatFileSize, getFileCategory } from '@/lib/hash';

interface FileUploaderProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  maxFiles?: number;
}

const ACCEPTED_TYPES = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'audio/*': ['.mp3', '.wav', '.m4a'],
  'video/*': ['.mp4', '.mov', '.webm'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export function FileUploader({ files, setFiles, maxFiles = 25 }: FileUploaderProps) {
  const [isHashing, setIsHashing] = useState(false);

  const processFile = useCallback(async (uploadedFile: UploadedFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadedFile.id ? { ...f, status: 'hashing' as const } : f
    ));

    try {
      const hash = await computeFileHash(uploadedFile.file);
      
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'complete' as const, hash, uploadProgress: 100 } 
          : f
      ));
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'error' as const, errorMessage: 'Failed to process file' } 
          : f
      ));
    }
  }, [setFiles]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remainingSlots = maxFiles - files.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    const newFiles: UploadedFile[] = filesToAdd.map((file, index) => ({
      id: uuidv4(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      exhibitLabel: EXHIBIT_LABELS[files.length + index] || `${files.length + index + 1}`,
      uploadProgress: 0,
      status: 'pending' as const,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    setIsHashing(true);
    for (const file of newFiles) {
      await processFile(file);
    }
    setIsHashing(false);
  }, [files.length, maxFiles, processFile, setFiles]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      return filtered.map((f, index) => ({
        ...f,
        exhibitLabel: EXHIBIT_LABELS[index] || `${index + 1}`,
      }));
    });
  }, [setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles || isHashing,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer',
          'flex flex-col items-center justify-center text-center min-h-[200px]',
          isDragActive 
            ? 'border-accent bg-accent/5 scale-[1.02]' 
            : 'border-border hover:border-accent/50 hover:bg-muted/50',
          (files.length >= maxFiles || isHashing) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        <div className={cn(
          'rounded-full p-4 mb-4 transition-colors',
          isDragActive ? 'bg-accent/10' : 'bg-muted'
        )}>
          <Upload className={cn(
            'w-8 h-8 transition-colors',
            isDragActive ? 'text-accent' : 'text-muted-foreground'
          )} />
        </div>

        <h3 className="font-display text-lg font-semibold text-foreground mb-2">
          {isDragActive ? 'Drop files here' : 'Upload Evidence Files'}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          Drag & drop files or click to browse
        </p>
        
        <p className="text-xs text-muted-foreground">
          Supported: Images, PDFs, Audio, Video, Text • Max {maxFiles} files
        </p>

        {files.length > 0 && (
          <p className="text-xs text-accent mt-2 font-medium">
            {files.length} of {maxFiles} files uploaded
          </p>
        )}
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h4 className="font-display text-sm font-semibold text-foreground">
              Evidence Files ({files.length})
            </h4>
            
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground font-display font-semibold text-sm">
                  {file.exhibitLabel}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {getFileCategory(file.type)} • {formatFileSize(file.size)}
                    </span>
                    {file.hash && (
                      <span className="text-xs text-accent font-mono truncate max-w-[120px]">
                        {file.hash.substring(0, 12)}...
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {file.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full bg-muted" />
                  )}
                  {file.status === 'hashing' && (
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                  )}
                  {file.status === 'complete' && (
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(file.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
