// ============================================================
// Yilow Spaces — Node Registry
// Central registry for all node types, their metadata, and port types
// ============================================================

export type PortType = 'text' | 'image' | 'video' | 'audio' | 'any';

export interface PortDefinition {
  id: string;
  label: string;
  type: PortType;
  multiple?: boolean; // Accepts multiple connections
}

export interface NodeTypeDefinition {
  type: string;
  label: string;
  labelAr: string;
  icon: string; // lucide icon name
  category: 'input' | 'generator' | 'transformer' | 'utility';
  categoryAr: string;
  description: string;
  descriptionAr: string;
  inputs: PortDefinition[];
  outputs: PortDefinition[];
  color: string; // Node accent color
  portColor: string; // Handle/port color for this node's primary type
}

// Port type colors
export const PORT_COLORS: Record<PortType, string> = {
  text: '#A78BFA',     // Violet
  image: '#22D3EE',    // Cyan
  video: '#F59E0B',    // Amber
  audio: '#34D399',    // Green
  any: '#94A3B8',      // Slate
};

// Full node type definitions
export const NODE_TYPES: Record<string, NodeTypeDefinition> = {
  text: {
    type: 'text',
    label: 'Text',
    labelAr: 'نص',
    icon: 'Type',
    category: 'input',
    categoryAr: 'مدخلات',
    description: 'Write prompts, scripts or notes',
    descriptionAr: 'كتابة برومبتات أو ملاحظات',
    inputs: [],
    outputs: [{ id: 'text-out', label: 'Text', type: 'text' }],
    color: '#A78BFA',
    portColor: PORT_COLORS.text,
  },
  'image-generator': {
    type: 'image-generator',
    label: 'Image Generator',
    labelAr: 'مولّد الصور',
    icon: 'ImagePlus',
    category: 'generator',
    categoryAr: 'توليد',
    description: 'Generate images with AI models',
    descriptionAr: 'توليد صور بالذكاء الاصطناعي',
    inputs: [
      { id: 'prompt-in', label: 'Prompt', type: 'text' },
      { id: 'reference-in', label: 'Reference', type: 'image', multiple: true },
    ],
    outputs: [{ id: 'image-out', label: 'Image', type: 'image' }],
    color: '#22D3EE',
    portColor: PORT_COLORS.image,
  },
  'video-generator': {
    type: 'video-generator',
    label: 'Video Generator',
    labelAr: 'مولّد الفيديو',
    icon: 'Film',
    category: 'generator',
    categoryAr: 'توليد',
    description: 'Generate video from text or images',
    descriptionAr: 'توليد فيديو من نص أو صور',
    inputs: [
      { id: 'prompt-in', label: 'Prompt', type: 'text' },
      { id: 'image-in', label: 'Start Frame', type: 'image' },
    ],
    outputs: [{ id: 'video-out', label: 'Video', type: 'video' }],
    color: '#F59E0B',
    portColor: PORT_COLORS.video,
  },
  'audio-generator': {
    type: 'audio-generator',
    label: 'Audio Generator',
    labelAr: 'مولّد الصوت',
    icon: 'Volume2',
    category: 'generator',
    categoryAr: 'توليد',
    description: 'Generate speech, music, or sound effects',
    descriptionAr: 'توليد كلام أو موسيقى أو مؤثرات صوتية',
    inputs: [{ id: 'text-in', label: 'Text', type: 'text' }],
    outputs: [{ id: 'audio-out', label: 'Audio', type: 'audio' }],
    color: '#34D399',
    portColor: PORT_COLORS.audio,
  },
  upscaler: {
    type: 'upscaler',
    label: 'Image Upscaler',
    labelAr: 'محسّن الصور',
    icon: 'ZoomIn',
    category: 'transformer',
    categoryAr: 'تحسين',
    description: 'Enhance image resolution and quality',
    descriptionAr: 'تكبير وتحسين جودة الصور',
    inputs: [{ id: 'image-in', label: 'Image', type: 'image' }],
    outputs: [{ id: 'image-out', label: 'Enhanced', type: 'image' }],
    color: '#06B6D4',
    portColor: PORT_COLORS.image,
  },
  assistant: {
    type: 'assistant',
    label: 'AI Assistant',
    labelAr: 'المساعد الذكي',
    icon: 'Bot',
    category: 'transformer',
    categoryAr: 'تحسين',
    description: 'Refine prompts, generate ideas, transform text',
    descriptionAr: 'تحسين البرومبتات وتوليد الأفكار',
    inputs: [{ id: 'text-in', label: 'Input', type: 'text' }],
    outputs: [{ id: 'text-out', label: 'Output', type: 'text' }],
    color: '#8B5CF6',
    portColor: PORT_COLORS.text,
  },
  upload: {
    type: 'upload',
    label: 'Upload',
    labelAr: 'رفع ملف',
    icon: 'Upload',
    category: 'input',
    categoryAr: 'مدخلات',
    description: 'Upload images, videos, or audio files',
    descriptionAr: 'رفع صور أو فيديو أو ملفات صوتية',
    inputs: [],
    outputs: [{ id: 'file-out', label: 'File', type: 'any' }],
    color: '#64748B',
    portColor: PORT_COLORS.any,
  },
  list: {
    type: 'list',
    label: 'List',
    labelAr: 'قائمة دُفعية',
    icon: 'List',
    category: 'utility',
    categoryAr: 'أدوات',
    description: 'Batch process multiple items at once',
    descriptionAr: 'تشغيل عدة عناصر دفعياً',
    inputs: [{ id: 'items-in', label: 'Items', type: 'any', multiple: true }],
    outputs: [{ id: 'items-out', label: 'Results', type: 'any' }],
    color: '#F472B6',
    portColor: PORT_COLORS.any,
  },
  'sticky-note': {
    type: 'sticky-note',
    label: 'Sticky Note',
    labelAr: 'ملاحظة لاصقة',
    icon: 'StickyNote',
    category: 'utility',
    categoryAr: 'أدوات',
    description: 'Add notes and annotations to your canvas',
    descriptionAr: 'إضافة ملاحظات وتعليقات على الكانفس',
    inputs: [],
    outputs: [],
    color: '#FCD34D',
    portColor: '#FCD34D',
  },
};

// Grouped by category for the add-node panel
export const NODE_CATEGORIES = [
  {
    id: 'input',
    label: 'Inputs',
    labelAr: 'مدخلات',
    icon: 'ArrowDownToLine',
    nodes: ['text', 'upload'],
  },
  {
    id: 'generator',
    label: 'Generators',
    labelAr: 'توليد',
    icon: 'Sparkles',
    nodes: ['image-generator', 'video-generator', 'audio-generator'],
  },
  {
    id: 'transformer',
    label: 'Transformers',
    labelAr: 'تحسين',
    icon: 'Wand2',
    nodes: ['upscaler', 'assistant'],
  },
  {
    id: 'utility',
    label: 'Utilities',
    labelAr: 'أدوات',
    icon: 'Wrench',
    nodes: ['list', 'sticky-note'],
  },
];
