import {
  Server, Database, Zap, Radio, MapPin, Image, CreditCard, Mail,
  BarChart3, TrendingUp, Cloud, Search, MessageSquare, MessageCircle,
  Calendar, FileCode, Flame, Network, Smartphone, LayoutGrid, Box, Boxes,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Tech-stack → icon lookup, shared by ArchitectureDiagram and any
   other component that renders a stack chip. Keyword-matched (not
   exact-match) so stack entries like "Twilio (SMS)" or "AWS S3 &
   CloudFront" still resolve without needing an entry per variant.
   Falls back to Boxes for anything unrecognized — new stack items
   added to caseStudies.js never break the diagram.
   ═══════════════════════════════════════════════════════════════ */

const RULES = [
  [/next\.js|^react$|react native|d3\.js/i, LayoutGrid],
  [/node\.js/i, Server],
  [/postgres|sql/i, Database],
  [/redis/i, Zap],
  [/websocket/i, Radio],
  [/google maps/i, MapPin],
  [/cloudinary|s3|cloudfront|image/i, Image],
  [/stripe/i, CreditCard],
  [/sendgrid|mail/i, Mail],
  [/alpha vantage/i, TrendingUp],
  [/cloudflare|cloud/i, Cloud],
  [/algolia|search/i, Search],
  [/twilio|sms/i, MessageSquare],
  [/whatsapp/i, MessageCircle],
  [/calendar/i, Calendar],
  [/docker/i, Box],
  [/quickbooks|typescript/i, FileCode],
  [/firebase/i, Flame],
  [/channel manager|api integrations|network/i, Network],
  [/mobile|smartphone/i, Smartphone],
];

export const getStackIcon = (name = '') => {
  for (const [pattern, Icon] of RULES) {
    if (pattern.test(name)) return Icon;
  }
  return Boxes;
};
