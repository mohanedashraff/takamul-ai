import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  category: string;
  credits: number;
  bgClass: string;
  iconColorClass: string;
  isNew?: boolean;
}

export function ToolCard({
  title,
  description,
  icon: Icon,
  href,
  category,
  credits,
  bgClass,
  iconColorClass,
  isNew
}: ToolCardProps) {
  return (
    <Link href={href}>
      <Card className="group h-full cursor-pointer relative overflow-hidden bg-bg-secondary hover:bg-bg-tertiary border-border-primary hover:border-primary-500/40 transition-all duration-300">
        
        {/* Hover Highlight */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {isNew && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="success" className="shadow-lg shadow-success/20">جديد</Badge>
          </div>
        )}

        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", bgClass)}>
              <Icon className={cn("w-6 h-6", iconColorClass)} />
            </div>
          </div>
          <CardTitle className="text-lg text-white font-bold group-hover:text-primary-400 transition-colors">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-text-secondary mt-2 line-clamp-2">
            {description}
          </CardDescription>

          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border-primary/50">
            <Badge variant="secondary" className="font-normal text-xs">{category}</Badge>
            <span className="text-xs text-text-tertiary flex-1 text-left">
              {credits} كريديت
            </span>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
