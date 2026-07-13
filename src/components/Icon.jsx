/* Curated icon registry. We import only the icons the app actually uses so the
   bundle stays small — important for users on slow rural connections. Add a
   name here when you reference a new icon; unknown names fall back to Circle. */
import {
  Circle, Search, X, ChevronDown, ChevronLeft, ChevronRight, Check, CheckCircle2,
  Info, AlertCircle, AlertTriangle, CloudOff, RotateCcw, Inbox, Wrench, SearchX,
  House, Sparkles, LayoutGrid, User, Store, Bell, Settings, LogOut, Languages,
  Sprout, Wheat, Milk, Bird, Rabbit, PiggyBank, Fish, Bug, Leaf, Package,
  Bot, Stethoscope, Calculator, Scale, Landmark, CloudSun, LineChart, CalendarDays,
  Briefcase, MessageCircle, TrendingUp, TrendingDown, BarChart3, Users, ShoppingBag,
  Tractor, Pill, FlaskConical, Send, GraduationCap, Building2, ShieldCheck, Truck,
  Crown, CreditCard, FileText, LifeBuoy, Lock, CloudRain, Droplets, Wind,
  ArrowDownLeft, ArrowUpRight, ScanLine, Camera, Newspaper, Moon, Sun, SmartphoneNfc,
  SlidersHorizontal, Wallet, Mic, Volume2, Star, Download, Trash2,
  Cloud, CloudFog, CloudDrizzle, CloudLightning, Snowflake, Umbrella,
  Thermometer, Gauge, MapPin, Navigation, Compass, LocateFixed, Plus, RefreshCw,
  Clock, SprayCan,
  BookmarkPlus, BookmarkCheck, ExternalLink, BadgeCheck, BadgeAlert, Lightbulb,
  Receipt, PlusCircle, ArrowDownCircle, ArrowUpCircle, BellRing, BellOff,
} from "lucide-react";

const REGISTRY = {
  Circle, Search, X, ChevronDown, ChevronLeft, ChevronRight, Check, CheckCircle2,
  Info, AlertCircle, AlertTriangle, CloudOff, RotateCcw, Inbox, Wrench, SearchX,
  House, Sparkles, LayoutGrid, User, Store, Bell, Settings, LogOut, Languages,
  Sprout, Wheat, Milk, Bird, Rabbit, PiggyBank, Fish, Bug, Leaf, Package,
  Bot, Stethoscope, Calculator, Scale, Landmark, CloudSun, LineChart, CalendarDays,
  Briefcase, MessageCircle, TrendingUp, TrendingDown, BarChart3, Users, ShoppingBag,
  Tractor, Pill, FlaskConical, Send, GraduationCap, Building2, ShieldCheck, Truck,
  Crown, CreditCard, FileText, LifeBuoy, Lock, CloudRain, Droplets, Wind,
  ArrowDownLeft, ArrowUpRight, ScanLine, Camera, Newspaper, Moon, Sun, SmartphoneNfc,
  SlidersHorizontal, Wallet, Mic, Volume2, Star, Download, Trash2,
  Cloud, CloudFog, CloudDrizzle, CloudLightning, Snowflake, Umbrella,
  Thermometer, Gauge, MapPin, Navigation, Compass, LocateFixed, Plus, RefreshCw,
  Clock, SprayCan,
  BookmarkPlus, BookmarkCheck, ExternalLink, BadgeCheck, BadgeAlert, Lightbulb,
  Receipt, PlusCircle, ArrowDownCircle, ArrowUpCircle, BellRing, BellOff,
};

export default function Icon({ name, size = 20, color = "currentColor", strokeWidth = 2, style }) {
  const Cmp = REGISTRY[name] || Circle;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}
