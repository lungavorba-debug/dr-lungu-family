import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export interface SignaturePadHandle {
  getCanvas: () => HTMLCanvasElement | null;
  clear: () => void;
}

interface SignaturePadProps {
  onChange?: (hasInk: boolean) => void;
}

interface DrawPoint {
  x: number;
  y: number;
}

function getPoint(event: PointerEvent, canvas: HTMLCanvasElement): DrawPoint {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { onChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<DrawPoint | null>(null);
  const hasInkRef = useRef(false);

  function paintBackground(context: CanvasRenderingContext2D, width: number, height: number) {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  function configureContext(context: CanvasRenderingContext2D, pixelRatio: number) {
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2.75 * pixelRatio;
    context.strokeStyle = '#0f172a';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
  }

  function clearPad() {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    paintBackground(context, canvas.width, canvas.height);
    hasInkRef.current = false;
    onChange?.(false);
    lastPointRef.current = null;
  }

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    clear: clearPad,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;

    contextRef.current = context;

    function markInk() {
      if (!hasInkRef.current) {
        hasInkRef.current = true;
        onChange?.(true);
      }
    }

    function drawSegment(from: DrawPoint, to: DrawPoint) {
      if (!contextRef.current) return;

      const activeContext = contextRef.current;
      activeContext.beginPath();
      activeContext.moveTo(from.x, from.y);
      activeContext.lineTo(to.x, to.y);
      activeContext.stroke();
      markInk();
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const target = event.currentTarget as HTMLCanvasElement;
      event.preventDefault();
      target.setPointerCapture(event.pointerId);
      isDrawingRef.current = true;
      lastPointRef.current = getPoint(event, target);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!isDrawingRef.current) return;

      const target = event.currentTarget as HTMLCanvasElement;
      event.preventDefault();
      const point = getPoint(event, target);
      const lastPoint = lastPointRef.current;
      if (lastPoint) {
        drawSegment(lastPoint, point);
      }
      lastPointRef.current = point;
    }

    function handlePointerUp(event: PointerEvent) {
      if (!isDrawingRef.current) return;

      const target = event.currentTarget as HTMLCanvasElement;
      isDrawingRef.current = false;
      lastPointRef.current = null;

      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
      const snapshot = hasInkRef.current ? canvas.toDataURL('image/png') : null;

      canvas.width = Math.floor(rect.width * pixelRatio);
      canvas.height = Math.floor(rect.height * pixelRatio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      context.setTransform(1, 0, 0, 1, 0, 0);
      configureContext(context, pixelRatio);
      paintBackground(context, canvas.width, canvas.height);

      if (snapshot) {
        const image = new Image();
        image.onload = () => {
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
        };
        image.src = snapshot;
      }
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener('resize', resize);

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);
    canvas.addEventListener('pointerleave', handlePointerUp);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerUp);
    };
  }, [onChange]);

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        className="h-52 w-full touch-none rounded-xl border border-brand-primary/25 bg-white shadow-inner sm:h-60"
        style={{ touchAction: 'none' }}
        aria-label="Zonă de semnătură participant"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={clearPad}
          className="min-h-touch rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Șterge semnătura
        </button>
      </div>
    </div>
  );
});
