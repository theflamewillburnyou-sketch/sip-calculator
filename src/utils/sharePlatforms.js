/**
 * Platform share URL builders and action types.
 * Platforms without web intents use `action: 'copy'` or `action: 'native'`.
 */

function enc(value) {
  return encodeURIComponent(value ?? '');
}

export const SHARE_GROUPS = [
  { id: 'popular', label: 'Popular in India' },
  { id: 'social', label: 'Social networks' },
  { id: 'professional', label: 'Professional & email' },
  { id: 'more', label: 'More platforms' },
  { id: 'quick', label: 'Quick actions' },
];

export const SHARE_PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    group: 'popular',
    brandColor: '#25D366',
    type: 'link',
    getUrl: ({ text, url }) =>
      `https://wa.me/?text=${enc(`${text}\n\n${url}`)}`,
  },
  {
    id: 'telegram',
    name: 'Telegram',
    group: 'popular',
    brandColor: '#26A5E4',
    type: 'link',
    getUrl: ({ text, url }) =>
      `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    group: 'social',
    brandColor: '#1877F2',
    type: 'link',
    getUrl: ({ url }) =>
      `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    group: 'social',
    brandColor: '#E4405F',
    type: 'copy',
    hint: 'Link copied — paste in Instagram Story or DM',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    group: 'social',
    brandColor: '#000000',
    type: 'link',
    getUrl: ({ text, url }) =>
      `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    group: 'social',
    brandColor: '#FFFC00',
    type: 'copy',
    hint: 'Link copied — paste in Snapchat chat',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    group: 'professional',
    brandColor: '#0A66C2',
    type: 'link',
    getUrl: ({ url }) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    group: 'professional',
    brandColor: '#EA4335',
    type: 'link',
    getUrl: ({ title, description, url }) =>
      `https://mail.google.com/mail/?view=cm&fs=1&su=${enc(title)}&body=${enc(`${description}\n\n${url}`)}`,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    group: 'more',
    brandColor: '#E60023',
    type: 'link',
    getUrl: ({ url, description, image }) => {
      const params = new URLSearchParams({
        url,
        description,
      });
      if (image) params.set('media', image);
      return `https://pinterest.com/pin/create/button/?${params.toString()}`;
    },
  },
  {
    id: 'reddit',
    name: 'Reddit',
    group: 'more',
    brandColor: '#FF4500',
    type: 'link',
    getUrl: ({ title, url }) =>
      `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`,
  },
  {
    id: 'discord',
    name: 'Discord',
    group: 'more',
    brandColor: '#5865F2',
    type: 'copy',
    hint: 'Link copied — paste in any Discord channel',
  },
  {
    id: 'copy',
    name: 'Copy Link',
    group: 'quick',
    brandColor: '#8b5cf6',
    type: 'copy',
    hint: 'Strategy link copied to clipboard',
  },
  {
    id: 'native',
    name: 'Share…',
    group: 'quick',
    brandColor: '#6366f1',
    type: 'native',
    hint: 'Shared via your device',
  },
];

export function openShareLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=640');
}
