import React, { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle2, User as UserIcon } from 'lucide-react';
import { storage, ref, uploadBytesResumable, getDownloadURL } from '../../firebase';
import { useToast } from '../../context/ToastContext';

// Client-side image resize / compression helper
const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              reject(new Error('Canvas compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function ProfileHeader({ profile, user, onUpdateProfileImage }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const currentImageUrl = profile?.profileImageUrl || profile?.photoURL || user?.photoURL || '';
  const displayName = profile?.displayName || user?.displayName || 'WAGH User';
  const email = profile?.email || user?.email || 'N/A';

  const handleSelectFile = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('Please select an image file (JPG, PNG, WebP).', 'error');
      return;
    }

    // Reset file input value so re-selecting same file works
    e.target.value = '';

    try {
      setUploading(true);
      setUploadProgress(15);

      // Client-side compression to max 800px, 0.8 quality
      const compressedFile = await compressImage(file, 800, 800, 0.8);
      setUploadProgress(35);

      const storageRef = ref(storage, `profileImages/${user.uid}/avatar_${Date.now()}.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 60) + 35;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Storage upload error:', error);
          addToast('Failed to upload image: ' + error.message, 'error');
          setUploading(false);
          setUploadProgress(0);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await onUpdateProfileImage(downloadURL);
            addToast('Profile photo updated successfully!', 'success');
          } catch (err) {
            console.error('Firestore image update error:', err);
            addToast('Error saving profile image URL to document.', 'error');
          } finally {
            setUploading(false);
            setUploadProgress(0);
          }
        }
      );
    } catch (err) {
      console.error('Image upload flow error:', err);
      addToast('Error preparing image for upload: ' + err.message, 'error');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-wagh-border p-6 sm:p-8 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        {/* Circular Avatar + Upload Trigger */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-wagh-teal/20 shadow-md bg-gray-100 flex items-center justify-center relative">
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-wagh-teal text-wagh-gold text-3xl font-editorial font-bold flex items-center justify-center uppercase">
                {displayName.charAt(0) || <UserIcon className="w-10 h-10" />}
              </div>
            )}

            {/* Upload Overlay Loader */}
            {uploading && (
              <div className="absolute inset-0 bg-wagh-dark/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                <Loader2 className="w-6 h-6 animate-spin text-wagh-gold mb-1" />
                <span className="text-[10px] font-mono-tag font-bold">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* Change Photo Button Badge */}
          <button
            type="button"
            onClick={handleSelectFile}
            disabled={uploading}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-wagh-teal text-white border-2 border-white shadow-lg hover:bg-wagh-teal-dark hover:scale-110 transition-all duration-200 focus:outline-none disabled:opacity-50"
            title="Upload/Change Profile Photo"
          >
            <Camera className="w-4 h-4" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
        </div>

        {/* User Info */}
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="font-editorial text-2xl sm:text-3xl font-extrabold text-wagh-dark leading-tight">
              {displayName}
            </h2>
            <CheckCircle2 className="w-5 h-5 text-wagh-teal shrink-0" title="Private Account" />
          </div>
          
          <p className="text-xs font-mono-tag text-wagh-muted flex items-center justify-center sm:justify-start gap-1">
            <span>Email:</span>
            <span className="font-semibold text-wagh-dark bg-gray-100 px-2 py-0.5 rounded">{email}</span>
            <span className="text-[10px] text-wagh-muted italic">(Read-only)</span>
          </p>

          {uploading && (
            <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-wagh-teal h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="text-right">
        <span className="px-3.5 py-1.5 rounded-full bg-wagh-gold/20 text-wagh-teal text-xs font-mono-tag font-bold tracking-wider uppercase border border-wagh-gold/40">
          Private Workspace
        </span>
      </div>
    </div>
  );
}

export default ProfileHeader;
