import { useState, useRef, useCallback } from 'react';
import { Upload, X, ZoomIn, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function SingleUploader({ label, side, file, onFileChange, onRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const validate = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      return 'Only JPG, PNG, and WEBP images are accepted.';
    }
    if (f.size > MAX_FILE_SIZE) {
      return 'File size must be under 10MB.';
    }
    return '';
  };

  const handleFile = useCallback((f) => {
    const err = validate(f);
    setValidationError(err);
    if (!err) {
      onFileChange(f);
    }
  }, [onFileChange]);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e) => {
    const selected = e.target.files[0];
    if (selected) handleFile(selected);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-platinum">
          {label}
        </h3>
        <span className={`text-xs font-mono px-2 py-1 rounded border ${
          file
            ? 'text-green-400 border-green-400/40 bg-green-400/10'
            : 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10'
        }`}>
          {file ? 'READY' : 'REQUIRED'}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={`upload-zone rounded-xl p-6 min-h-[220px] flex flex-col items-center justify-center cursor-pointer transition-all relative
          ${isDragging ? 'drag-over' : ''}
          ${file ? 'has-image' : ''}
        `}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !file && inputRef.current?.click()}
      >
        {file && previewUrl ? (
          <div className="relative w-full h-full flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={previewUrl}
                alt={`Card ${side}`}
                className="max-h-40 max-w-full object-contain rounded-lg shadow-2xl"
                style={{ filter: 'drop-shadow(0 0 12px rgba(201,168,76,0.4))' }}
              />
              {/* Zoom button */}
              <button
                onClick={(e) => { e.stopPropagation(); setIsZoomed(true); }}
                className="absolute top-2 right-2 bg-black/70 hover:bg-gold/80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Zoom image"
              >
                <ZoomIn size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-platinum/70">
              <span className="font-mono text-xs truncate max-w-[180px]">{file.name}</span>
              <span className="text-platinum/40">•</span>
              <span className="font-mono text-xs">{(file.size / 1024).toFixed(0)}KB</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); setValidationError(''); }}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 px-3 py-1.5 rounded-full transition-all"
            >
              <X size={12} />
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Upload size={28} className="text-gold/70" />
            </div>
            <div>
              <p className="text-platinum font-medium">Drop {side} image here</p>
              <p className="text-platinum/50 text-sm mt-1">or click to browse</p>
              <p className="text-platinum/30 text-xs mt-2 font-mono">JPG · PNG · WEBP · max 10MB</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {validationError && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={14} />
          <span>{validationError}</span>
        </div>
      )}

      {/* Zoom modal */}
      {isZoomed && previewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
          onClick={() => setIsZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full p-2"
            onClick={() => setIsZoomed(false)}
          >
            <X size={24} />
          </button>
          <img
            src={previewUrl}
            alt={`Card ${side} zoomed`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
            style={{ filter: 'drop-shadow(0 0 30px rgba(201,168,76,0.3))' }}
          />
        </div>
      )}
    </div>
  );
}

export default function CardUploader({ frontFile, backFile, onFrontChange, onBackChange, onAnalyze, isAnalyzing, progress }) {
  const canAnalyze = frontFile && backFile && !isAnalyzing;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SingleUploader
          label="Front of Card"
          side="front"
          file={frontFile}
          onFileChange={onFrontChange}
          onRemove={() => onFrontChange(null)}
        />
        <SingleUploader
          label="Back of Card"
          side="back"
          file={backFile}
          onFileChange={onBackChange}
          onRemove={() => onBackChange(null)}
        />
      </div>

      {/* Missing indicator */}
      {(!frontFile || !backFile) && (
        <div className="mt-4 flex items-center gap-3 text-sm text-yellow-400/80 bg-yellow-400/5 border border-yellow-400/20 rounded-lg px-4 py-3">
          <AlertCircle size={16} />
          <span>
            {!frontFile && !backFile
              ? 'Upload both front and back images to begin analysis'
              : !frontFile
              ? 'Front image is required — please upload the card face'
              : 'Back image is required — please upload the card reverse'
            }
          </span>
        </div>
      )}

      {/* Analyze button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={`relative group px-10 py-4 rounded-xl font-display text-lg font-semibold transition-all duration-300
            ${canAnalyze
              ? 'bg-gold hover:bg-gold-light text-charcoal shadow-lg hover:shadow-gold/30 hover:shadow-2xl cursor-pointer'
              : 'bg-charcoal-surface text-platinum/30 cursor-not-allowed border border-platinum/10'
            }
          `}
        >
          {isAnalyzing ? (
            <span className="flex items-center gap-3">
              <span className="inline-block w-4 h-4 border-2 border-charcoal/40 border-t-charcoal rounded-full animate-spin" />
              {progress || 'Analyzing...'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>Begin Grading Analysis</span>
              {canAnalyze && (
                <span className="text-charcoal/60 text-sm font-mono">→</span>
              )}
            </span>
          )}
          {canAnalyze && !isAnalyzing && (
            <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
      </div>
    </div>
  );
}
