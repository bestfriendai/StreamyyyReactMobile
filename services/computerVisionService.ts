import { UnifiedStream } from './platformService';

export interface ImageAnalysis {
  id: string;
  imageUrl: string;
  objects: DetectedObject[];
  faces: DetectedFace[];
  text: ExtractedText[];
  colors: ColorAnalysis;
  composition: CompositionAnalysis;
  quality: ImageQuality;
  content: ContentAnalysis;
  aesthetic: AestheticAnalysis;
  metadata: {
    width: number;
    height: number;
    format: string;
    fileSize: number;
    processingTime: number;
    modelVersion: string;
    confidence: number;
  };
  timestamp: string;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  boundingBox: BoundingBox;
  attributes: ObjectAttribute[];
  category: string;
  subcategory?: string;
  actions?: string[];
  relationships?: ObjectRelationship[];
}

export interface DetectedFace {
  id: string;
  boundingBox: BoundingBox;
  landmarks: FaceLandmark[];
  attributes: FaceAttribute[];
  emotions: EmotionScore[];
  age: AgeEstimate;
  gender: GenderEstimate;
  ethnicity: EthnicityEstimate;
  pose: FacePose;
  quality: FaceQuality;
}

export interface ExtractedText {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language: string;
  fontSize: number;
  fontStyle: string;
  orientation: number;
  isOverlay: boolean;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObjectAttribute {
  name: string;
  value: string;
  confidence: number;
}

export interface ObjectRelationship {
  type: 'near' | 'inside' | 'on' | 'holding' | 'wearing' | 'using';
  targetObjectId: string;
  confidence: number;
}

export interface FaceLandmark {
  type: 'eye' | 'nose' | 'mouth' | 'eyebrow' | 'chin';
  points: { x: number; y: number }[];
}

export interface FaceAttribute {
  name: string;
  value: string;
  confidence: number;
}

export interface EmotionScore {
  emotion: 'happy' | 'sad' | 'angry' | 'surprised' | 'fearful' | 'disgusted' | 'neutral';
  score: number;
}

export interface AgeEstimate {
  min: number;
  max: number;
  most_likely: number;
  confidence: number;
}

export interface GenderEstimate {
  gender: 'male' | 'female' | 'non_binary';
  confidence: number;
}

export interface EthnicityEstimate {
  ethnicity: string;
  confidence: number;
}

export interface FacePose {
  pitch: number;
  roll: number;
  yaw: number;
}

export interface FaceQuality {
  blur: number;
  illumination: number;
  occlusion: number;
  pose_quality: number;
  overall: number;
}

export interface ColorAnalysis {
  dominantColors: ColorInfo[];
  palette: ColorInfo[];
  colorScheme: 'monochromatic' | 'complementary' | 'triadic' | 'analogous' | 'split_complementary';
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
}

export interface ColorInfo {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number;
  name: string;
}

export interface CompositionAnalysis {
  ruleOfThirds: RuleOfThirdsAnalysis;
  symmetry: SymmetryAnalysis;
  balance: BalanceAnalysis;
  leadingLines: LeadingLine[];
  patterns: Pattern[];
  perspective: PerspectiveAnalysis;
}

export interface RuleOfThirdsAnalysis {
  score: number;
  intersectionPoints: { x: number; y: number; strength: number }[];
  gridLines: { type: 'horizontal' | 'vertical'; position: number }[];
}

export interface SymmetryAnalysis {
  horizontal: number;
  vertical: number;
  radial: number;
  overall: number;
}

export interface BalanceAnalysis {
  visual: number;
  color: number;
  texture: number;
  overall: number;
}

export interface LeadingLine {
  start: { x: number; y: number };
  end: { x: number; y: number };
  strength: number;
  type: 'straight' | 'curved' | 'diagonal';
}

export interface Pattern {
  type: 'repetition' | 'rhythm' | 'texture' | 'gradient';
  strength: number;
  area: BoundingBox;
  description: string;
}

export interface PerspectiveAnalysis {
  vanishingPoints: { x: number; y: number }[];
  depth: number;
  scale: number;
  viewpoint: 'eye_level' | 'high_angle' | 'low_angle' | 'bird_eye' | 'worm_eye';
}

export interface ImageQuality {
  sharpness: number;
  noise: number;
  blur: number;
  exposure: number;
  dynamic_range: number;
  overall: number;
  technicalIssues: string[];
}

export interface ContentAnalysis {
  category: string;
  tags: string[];
  description: string;
  scene: SceneAnalysis;
  activity: ActivityAnalysis;
  content_rating: ContentRating;
  brand_detection: BrandDetection[];
}

export interface SceneAnalysis {
  location: string;
  environment: 'indoor' | 'outdoor' | 'mixed';
  lighting: 'natural' | 'artificial' | 'mixed';
  weather?: string;
  time_of_day?: string;
}

export interface ActivityAnalysis {
  primary_activity: string;
  secondary_activities: string[];
  intensity: 'low' | 'medium' | 'high';
  participants: number;
}

export interface ContentRating {
  overall: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  violence: number;
  adult_content: number;
  language: number;
  substance_use: number;
}

export interface BrandDetection {
  brand: string;
  confidence: number;
  boundingBox: BoundingBox;
  logo_type: string;
  context: string;
}

export interface AestheticAnalysis {
  beauty_score: number;
  creativity_score: number;
  artistic_style: string;
  mood: string;
  visual_appeal: number;
  professional_quality: number;
  uniqueness: number;
}

export interface VideoAnalysis {
  id: string;
  videoUrl: string;
  frames: FrameAnalysis[];
  summary: VideoSummary;
  highlights: VideoHighlight[];
  scenes: VideoScene[];
  motion: MotionAnalysis;
  audio: AudioAnalysis;
  quality: VideoQuality;
  metadata: {
    duration: number;
    fps: number;
    resolution: string;
    bitrate: number;
    format: string;
    fileSize: number;
    processingTime: number;
  };
  timestamp: string;
}

export interface FrameAnalysis {
  timestamp: number;
  frameNumber: number;
  imageAnalysis: ImageAnalysis;
  keyframe: boolean;
  scene_change: boolean;
  motion_intensity: number;
}

export interface VideoSummary {
  key_moments: KeyMoment[];
  dominant_colors: ColorInfo[];
  main_objects: string[];
  people_count: number;
  activity_level: number;
  content_type: string;
  description: string;
}

export interface KeyMoment {
  timestamp: number;
  duration: number;
  description: string;
  importance: number;
  thumbnail: string;
  tags: string[];
}

export interface VideoHighlight {
  start: number;
  end: number;
  type: 'action' | 'emotional' | 'visual' | 'audio' | 'social';
  score: number;
  description: string;
  thumbnail: string;
  reason: string;
}

export interface VideoScene {
  start: number;
  end: number;
  description: string;
  location: string;
  participants: string[];
  activities: string[];
  mood: string;
}

export interface MotionAnalysis {
  overall_intensity: number;
  camera_motion: CameraMotion;
  object_tracking: ObjectTracking[];
  optical_flow: OpticalFlow;
  stability: number;
}

export interface CameraMotion {
  pan: number;
  tilt: number;
  zoom: number;
  shake: number;
  tracking: boolean;
}

export interface ObjectTracking {
  objectId: string;
  object_type: string;
  trajectory: { x: number; y: number; timestamp: number }[];
  velocity: number;
  acceleration: number;
  direction: number;
}

export interface OpticalFlow {
  magnitude: number;
  direction: number;
  consistency: number;
  density: number;
}

export interface AudioAnalysis {
  loudness: number;
  frequency_spectrum: FrequencyBand[];
  speech_detection: SpeechSegment[];
  music_detection: MusicSegment[];
  sound_effects: SoundEffect[];
  quality: AudioQuality;
}

export interface FrequencyBand {
  frequency: number;
  amplitude: number;
  range: string;
}

export interface SpeechSegment {
  start: number;
  end: number;
  speaker_id: string;
  language: string;
  confidence: number;
  emotion: string;
}

export interface MusicSegment {
  start: number;
  end: number;
  genre: string;
  tempo: number;
  key: string;
  mood: string;
}

export interface SoundEffect {
  start: number;
  end: number;
  type: string;
  intensity: number;
  description: string;
}

export interface AudioQuality {
  clarity: number;
  background_noise: number;
  distortion: number;
  overall: number;
}

export interface VideoQuality {
  resolution_score: number;
  bitrate_score: number;
  frame_rate_score: number;
  compression_artifacts: number;
  overall: number;
}

export interface ThumbnailGeneration {
  id: string;
  sourceUrl: string;
  thumbnails: GeneratedThumbnail[];
  recommendations: ThumbnailRecommendation[];
  metadata: {
    processingTime: number;
    algorithm: string;
    modelVersion: string;
  };
}

export interface GeneratedThumbnail {
  id: string;
  url: string;
  timestamp?: number;
  type: 'auto' | 'manual' | 'ai_generated';
  style: ThumbnailStyle;
  quality: number;
  predicted_ctr: number;
  appeal_score: number;
  uniqueness: number;
}

export interface ThumbnailStyle {
  name: string;
  description: string;
  filters: ImageFilter[];
  overlays: ThumbnailOverlay[];
  text_styling: TextStyling;
}

export interface ImageFilter {
  name: string;
  intensity: number;
  parameters: Record<string, number>;
}

export interface ThumbnailOverlay {
  type: 'text' | 'graphic' | 'emoji' | 'badge';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Record<string, any>;
}

export interface TextStyling {
  font_family: string;
  font_size: number;
  color: string;
  stroke: string;
  shadow: string;
  effects: string[];
}

export interface ThumbnailRecommendation {
  thumbnailId: string;
  reasoning: string;
  confidence: number;
  target_audience: string;
  expected_performance: {
    ctr: number;
    engagement: number;
    appeal: number;
  };
}

export interface StreamVisualAnalysis {
  streamId: string;
  platform: string;
  analysis: {
    current_frame: ImageAnalysis;
    thumbnail_analysis: ImageAnalysis;
    visual_quality: number;
    content_appropriateness: number;
    brand_safety: number;
    engagement_prediction: number;
  };
  recommendations: {
    thumbnail_optimization: string[];
    visual_improvements: string[];
    content_suggestions: string[];
  };
  real_time_metrics: {
    face_detection: boolean;
    object_count: number;
    motion_level: number;
    color_vibrance: number;
    text_overlay: boolean;
  };
}

class ComputerVisionService {
  private readonly baseUrl = process.env.EXPO_PUBLIC_AI_API_URL || 'https://api.streammulti.com/vision';
  private readonly apiKey = process.env.EXPO_PUBLIC_AI_API_KEY || '';
  private readonly cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('Computer Vision Service initialized');
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Vision API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Analyze image using computer vision
   */
  async analyzeImage(imageUrl: string, options?: {
    includeObjects?: boolean;
    includeFaces?: boolean;
    includeText?: boolean;
    includeColors?: boolean;
    includeComposition?: boolean;
    includeQuality?: boolean;
    includeContent?: boolean;
    includeAesthetic?: boolean;
  }): Promise<ImageAnalysis> {
    console.log('🔍 Analyzing image with computer vision:', imageUrl);
    
    try {
      const startTime = Date.now();
      
      const analysis = await this.makeRequest<ImageAnalysis>('/analyze/image', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          options: {
            includeObjects: options?.includeObjects ?? true,
            includeFaces: options?.includeFaces ?? true,
            includeText: options?.includeText ?? true,
            includeColors: options?.includeColors ?? true,
            includeComposition: options?.includeComposition ?? true,
            includeQuality: options?.includeQuality ?? true,
            includeContent: options?.includeContent ?? true,
            includeAesthetic: options?.includeAesthetic ?? true,
          }
        })
      });

      analysis.metadata.processingTime = Date.now() - startTime;
      
      console.log('✅ Image analysis completed in', analysis.metadata.processingTime, 'ms');
      return analysis;
      
    } catch (error) {
      console.error('❌ Failed to analyze image:', error);
      throw error;
    }
  }

  /**
   * Analyze video using computer vision
   */
  async analyzeVideo(videoUrl: string, options?: {
    maxFrames?: number;
    frameInterval?: number;
    includeAudio?: boolean;
    generateHighlights?: boolean;
    extractScenes?: boolean;
  }): Promise<VideoAnalysis> {
    console.log('🎬 Analyzing video with computer vision:', videoUrl);
    
    try {
      const startTime = Date.now();
      
      const analysis = await this.makeRequest<VideoAnalysis>('/analyze/video', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl,
          options: {
            maxFrames: options?.maxFrames ?? 30,
            frameInterval: options?.frameInterval ?? 10,
            includeAudio: options?.includeAudio ?? true,
            generateHighlights: options?.generateHighlights ?? true,
            extractScenes: options?.extractScenes ?? true,
          }
        })
      });

      analysis.metadata.processingTime = Date.now() - startTime;
      
      console.log('✅ Video analysis completed in', analysis.metadata.processingTime, 'ms');
      return analysis;
      
    } catch (error) {
      console.error('❌ Failed to analyze video:', error);
      throw error;
    }
  }

  /**
   * Generate optimized thumbnails
   */
  async generateThumbnails(sourceUrl: string, options?: {
    count?: number;
    styles?: string[];
    target_audience?: string;
    optimize_for?: 'ctr' | 'engagement' | 'appeal';
  }): Promise<ThumbnailGeneration> {
    console.log('🖼️ Generating optimized thumbnails for:', sourceUrl);
    
    try {
      const startTime = Date.now();
      
      const generation = await this.makeRequest<ThumbnailGeneration>('/generate/thumbnails', {
        method: 'POST',
        body: JSON.stringify({
          sourceUrl,
          options: {
            count: options?.count ?? 5,
            styles: options?.styles ?? ['vibrant', 'professional', 'gaming', 'artistic', 'minimal'],
            target_audience: options?.target_audience ?? 'general',
            optimize_for: options?.optimize_for ?? 'ctr',
          }
        })
      });

      generation.metadata.processingTime = Date.now() - startTime;
      
      console.log('✅ Thumbnail generation completed:', generation.thumbnails.length, 'thumbnails');
      return generation;
      
    } catch (error) {
      console.error('❌ Failed to generate thumbnails:', error);
      throw error;
    }
  }

  /**
   * Analyze stream visual content in real-time
   */
  async analyzeStreamVisuals(streamId: string, platform: string): Promise<StreamVisualAnalysis> {
    console.log('📺 Analyzing stream visuals:', streamId, 'on', platform);
    
    try {
      const analysis = await this.makeRequest<StreamVisualAnalysis>('/analyze/stream', {
        method: 'POST',
        body: JSON.stringify({
          streamId,
          platform,
          timestamp: new Date().toISOString()
        })
      });
      
      console.log('✅ Stream visual analysis completed');
      return analysis;
      
    } catch (error) {
      console.error('❌ Failed to analyze stream visuals:', error);
      throw error;
    }
  }

  /**
   * Detect and recognize objects in image
   */
  async detectObjects(imageUrl: string, options?: {
    threshold?: number;
    includeAttributes?: boolean;
    includeRelationships?: boolean;
    categories?: string[];
  }): Promise<DetectedObject[]> {
    console.log('🔍 Detecting objects in image:', imageUrl);
    
    try {
      const objects = await this.makeRequest<DetectedObject[]>('/detect/objects', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          options: {
            threshold: options?.threshold ?? 0.5,
            includeAttributes: options?.includeAttributes ?? true,
            includeRelationships: options?.includeRelationships ?? false,
            categories: options?.categories ?? [],
          }
        })
      });
      
      console.log('✅ Object detection completed:', objects.length, 'objects found');
      return objects;
      
    } catch (error) {
      console.error('❌ Failed to detect objects:', error);
      throw error;
    }
  }

  /**
   * Detect and analyze faces in image
   */
  async detectFaces(imageUrl: string, options?: {
    includeEmotions?: boolean;
    includeAge?: boolean;
    includeGender?: boolean;
    includeLandmarks?: boolean;
    includeQuality?: boolean;
  }): Promise<DetectedFace[]> {
    console.log('👤 Detecting faces in image:', imageUrl);
    
    try {
      const faces = await this.makeRequest<DetectedFace[]>('/detect/faces', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          options: {
            includeEmotions: options?.includeEmotions ?? true,
            includeAge: options?.includeAge ?? true,
            includeGender: options?.includeGender ?? true,
            includeLandmarks: options?.includeLandmarks ?? false,
            includeQuality: options?.includeQuality ?? true,
          }
        })
      });
      
      console.log('✅ Face detection completed:', faces.length, 'faces found');
      return faces;
      
    } catch (error) {
      console.error('❌ Failed to detect faces:', error);
      throw error;
    }
  }

  /**
   * Extract text from image using OCR
   */
  async extractText(imageUrl: string, options?: {
    languages?: string[];
    includeFormatting?: boolean;
    filterOverlays?: boolean;
  }): Promise<ExtractedText[]> {
    console.log('📄 Extracting text from image:', imageUrl);
    
    try {
      const text = await this.makeRequest<ExtractedText[]>('/extract/text', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          options: {
            languages: options?.languages ?? ['en'],
            includeFormatting: options?.includeFormatting ?? true,
            filterOverlays: options?.filterOverlays ?? true,
          }
        })
      });
      
      console.log('✅ Text extraction completed:', text.length, 'text elements found');
      return text;
      
    } catch (error) {
      console.error('❌ Failed to extract text:', error);
      throw error;
    }
  }

  /**
   * Analyze image composition and aesthetics
   */
  async analyzeComposition(imageUrl: string): Promise<CompositionAnalysis> {
    console.log('🎨 Analyzing image composition:', imageUrl);
    
    try {
      const composition = await this.makeRequest<CompositionAnalysis>('/analyze/composition', {
        method: 'POST',
        body: JSON.stringify({ imageUrl })
      });
      
      console.log('✅ Composition analysis completed');
      return composition;
      
    } catch (error) {
      console.error('❌ Failed to analyze composition:', error);
      throw error;
    }
  }

  /**
   * Analyze color palette and scheme
   */
  async analyzeColors(imageUrl: string, options?: {
    paletteSize?: number;
    includeNames?: boolean;
    includeHarmony?: boolean;
  }): Promise<ColorAnalysis> {
    console.log('🎨 Analyzing image colors:', imageUrl);
    
    try {
      const colors = await this.makeRequest<ColorAnalysis>('/analyze/colors', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          options: {
            paletteSize: options?.paletteSize ?? 8,
            includeNames: options?.includeNames ?? true,
            includeHarmony: options?.includeHarmony ?? true,
          }
        })
      });
      
      console.log('✅ Color analysis completed');
      return colors;
      
    } catch (error) {
      console.error('❌ Failed to analyze colors:', error);
      throw error;
    }
  }

  /**
   * Assess image quality and technical aspects
   */
  async assessImageQuality(imageUrl: string): Promise<ImageQuality> {
    console.log('📊 Assessing image quality:', imageUrl);
    
    try {
      const quality = await this.makeRequest<ImageQuality>('/assess/quality', {
        method: 'POST',
        body: JSON.stringify({ imageUrl })
      });
      
      console.log('✅ Image quality assessment completed');
      return quality;
      
    } catch (error) {
      console.error('❌ Failed to assess image quality:', error);
      throw error;
    }
  }

  /**
   * Generate video highlights automatically
   */
  async generateVideoHighlights(videoUrl: string, options?: {
    maxHighlights?: number;
    minDuration?: number;
    maxDuration?: number;
    highlightTypes?: string[];
  }): Promise<VideoHighlight[]> {
    console.log('⭐ Generating video highlights:', videoUrl);
    
    try {
      const highlights = await this.makeRequest<VideoHighlight[]>('/generate/highlights', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl,
          options: {
            maxHighlights: options?.maxHighlights ?? 10,
            minDuration: options?.minDuration ?? 5,
            maxDuration: options?.maxDuration ?? 30,
            highlightTypes: options?.highlightTypes ?? ['action', 'emotional', 'visual', 'social'],
          }
        })
      });
      
      console.log('✅ Video highlights generated:', highlights.length, 'highlights');
      return highlights;
      
    } catch (error) {
      console.error('❌ Failed to generate video highlights:', error);
      throw error;
    }
  }

  /**
   * Track objects across video frames
   */
  async trackObjects(videoUrl: string, objectsToTrack: string[]): Promise<ObjectTracking[]> {
    console.log('🎯 Tracking objects in video:', videoUrl);
    
    try {
      const tracking = await this.makeRequest<ObjectTracking[]>('/track/objects', {
        method: 'POST',
        body: JSON.stringify({
          videoUrl,
          objectsToTrack
        })
      });
      
      console.log('✅ Object tracking completed:', tracking.length, 'objects tracked');
      return tracking;
      
    } catch (error) {
      console.error('❌ Failed to track objects:', error);
      throw error;
    }
  }

  /**
   * Detect brand logos and products
   */
  async detectBrands(imageUrl: string, options?: {
    includeProducts?: boolean;
    includeContext?: boolean;
    threshold?: number;
  }): Promise<BrandDetection[]> {
    console.log('🏢 Detecting brands in image:', imageUrl);
    
    try {
      const brands = await this.makeRequest<BrandDetection[]>('/detect/brands', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          options: {
            includeProducts: options?.includeProducts ?? true,
            includeContext: options?.includeContext ?? true,
            threshold: options?.threshold ?? 0.6,
          }
        })
      });
      
      console.log('✅ Brand detection completed:', brands.length, 'brands found');
      return brands;
      
    } catch (error) {
      console.error('❌ Failed to detect brands:', error);
      throw error;
    }
  }

  /**
   * Analyze content for safety and appropriateness
   */
  async analyzeContentSafety(imageUrl: string): Promise<ContentRating> {
    console.log('🛡️ Analyzing content safety:', imageUrl);
    
    try {
      const safety = await this.makeRequest<ContentRating>('/analyze/safety', {
        method: 'POST',
        body: JSON.stringify({ imageUrl })
      });
      
      console.log('✅ Content safety analysis completed');
      return safety;
      
    } catch (error) {
      console.error('❌ Failed to analyze content safety:', error);
      throw error;
    }
  }

  /**
   * Compare two images for similarity
   */
  async compareImages(imageUrl1: string, imageUrl2: string): Promise<{
    similarity: number;
    differences: string[];
    visualDifferences: BoundingBox[];
    recommendation: string;
  }> {
    console.log('🔍 Comparing images:', imageUrl1, 'vs', imageUrl2);
    
    try {
      const comparison = await this.makeRequest<{
        similarity: number;
        differences: string[];
        visualDifferences: BoundingBox[];
        recommendation: string;
      }>('/compare/images', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl1,
          imageUrl2
        })
      });
      
      console.log('✅ Image comparison completed, similarity:', comparison.similarity);
      return comparison;
      
    } catch (error) {
      console.error('❌ Failed to compare images:', error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple images
   */
  async batchAnalyzeImages(imageUrls: string[], options?: {
    maxConcurrent?: number;
    includeComparison?: boolean;
    analysisOptions?: any;
  }): Promise<ImageAnalysis[]> {
    console.log('📦 Batch analyzing images:', imageUrls.length, 'images');
    
    try {
      const analyses = await this.makeRequest<ImageAnalysis[]>('/batch/analyze', {
        method: 'POST',
        body: JSON.stringify({
          imageUrls,
          options: {
            maxConcurrent: options?.maxConcurrent ?? 5,
            includeComparison: options?.includeComparison ?? false,
            analysisOptions: options?.analysisOptions ?? {},
          }
        })
      });
      
      console.log('✅ Batch analysis completed:', analyses.length, 'analyses');
      return analyses;
      
    } catch (error) {
      console.error('❌ Failed to batch analyze images:', error);
      throw error;
    }
  }

  /**
   * Generate content descriptions automatically
   */
  async generateDescription(imageUrl: string, options?: {
    style?: 'descriptive' | 'creative' | 'technical' | 'accessibility';
    language?: string;
    maxLength?: number;
  }): Promise<string> {
    console.log('📝 Generating content description:', imageUrl);
    
    try {
      const description = await this.makeRequest<{ description: string }>('/generate/description', {
        method: 'POST',
        body: JSON.stringify({
          imageUrl,
          options: {
            style: options?.style ?? 'descriptive',
            language: options?.language ?? 'en',
            maxLength: options?.maxLength ?? 200,
          }
        })
      });
      
      console.log('✅ Description generated');
      return description.description;
      
    } catch (error) {
      console.error('❌ Failed to generate description:', error);
      throw error;
    }
  }

  /**
   * Create visual embeddings for content similarity
   */
  async createVisualEmbedding(imageUrl: string): Promise<number[]> {
    console.log('🧠 Creating visual embedding:', imageUrl);
    
    try {
      const embedding = await this.makeRequest<{ embedding: number[] }>('/create/embedding', {
        method: 'POST',
        body: JSON.stringify({ imageUrl })
      });
      
      console.log('✅ Visual embedding created, dimensions:', embedding.embedding.length);
      return embedding.embedding;
      
    } catch (error) {
      console.error('❌ Failed to create visual embedding:', error);
      throw error;
    }
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('✅ Computer vision cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; oldestEntry: number } {
    const now = Date.now();
    let totalRequests = 0;
    let cacheHits = 0;
    let oldestTimestamp = now;
    
    for (const [, entry] of this.cache) {
      totalRequests++;
      if (now - entry.timestamp < this.cacheTimeout) {
        cacheHits++;
      }
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }
    
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? cacheHits / totalRequests : 0,
      oldestEntry: now - oldestTimestamp
    };
  }
}

export const computerVisionService = new ComputerVisionService();
export default computerVisionService;