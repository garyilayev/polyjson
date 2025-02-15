import { useState, useRef, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

type Point = { x: number; y: number };

type Polygon = Point[];

export default function ImagePolygonAnnotator() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [currentPolygon, setCurrentPolygon] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setPolygons([]);
        setCurrentPolygon([]);
        setIsDrawing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      setIsDrawing(true);
    }

    const { x, y } = getCanvasCoordinates(e);
    setCurrentPolygon((prev) => [...prev, { x, y }]);
  };

  const completePolygon = () => {
    if (currentPolygon.length >= 3) {
      setPolygons((prev) => [...prev, currentPolygon]);
      setCurrentPolygon([]);
      setIsDrawing(false);
      toast.success("Polygon completed");
    } else {
      toast.error("Need at least 3 points to complete a polygon");
    }
  };

  const clearPolygons = () => {
    setPolygons([]);
    setCurrentPolygon([]);
    setIsDrawing(false);
    toast.success("Polygons cleared 🧼");
  };

  const clearCurrent = () => {
    setCurrentPolygon([]);
    setIsDrawing(false);
    toast("Drawing cleared", { icon: "🗑️" });
  };

  const exportJSON = () => {
    const data = {
      polygons: polygons,
      currentPolygon: currentPolygon,
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success("JSON copied to clipboard");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const image = imageRef.current;

    if (!canvas || !ctx || !image || !imageSrc) return;

    const draw = () => {
      // Set canvas size to match image
      canvas.width = image.width;
      canvas.height = image.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw completed polygons
      polygons.forEach((polygon) => {
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        polygon.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
        ctx.fill();
      });

      // Draw current polygon
      if (currentPolygon.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPolygon[0].x, currentPolygon[0].y);
        currentPolygon.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = "#EF4444";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw points
        currentPolygon.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#EF4444";
          ctx.fill();
        });
      }
    };

    image.onload = draw;
    if (image.complete) draw();

    return () => {
      image.onload = null;
    };
  }, [polygons, currentPolygon, imageSrc]);

  return (
    <div className="min-h-screen bg-gray-100 p-8 w-full">
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6">
        <h1 className="text-2xl text-center font-bold text-gray-800">
          Image Polygon Annotator
        </h1>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="block text-sm font-medium text-gray-700">
              Upload Image:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="relative flex justify-center items-center bg-gray-50 rounded-lg p-4 min-h-[400px]">
            {!imageSrc ? (
              <div className="text-gray-500 text-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-2" />
                <p>Upload an image to start</p>
              </div>
            ) : (
              <div className="relative">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Uploaded"
                  className="max-w-full max-h-[500px] object-contain"
                />
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                />
              </div>
            )}
          </div>

          {imageSrc && (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={completePolygon}
                disabled={currentPolygon.length < 3}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-200 disabled:cursor-not-allowed"
              >
                Complete Polygon
              </button>
              <button
                onClick={clearCurrent}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Clear Current
              </button>
              <button
                onClick={clearPolygons}
                disabled={polygons.length === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:cursor-pointer hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                Clear all polygons
              </button>
              <button
                onClick={exportJSON}
                disabled={polygons.length === 0 && currentPolygon.length === 0}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
              >
                Export JSON
              </button>
            </div>
          )}

          {(polygons.length > 0 || currentPolygon.length > 0) && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Current Data
              </h2>
              <pre className="text-sm text-gray-600 overflow-x-auto">
                {JSON.stringify({ polygons, currentPolygon }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
