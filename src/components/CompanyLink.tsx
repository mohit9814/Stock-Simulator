"use client";

import { useState } from "react";
import CompanyModal from "./CompanyModal";
import { Info } from "lucide-react";

interface CompanyLinkProps {
  companyName: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

export default function CompanyLink({ companyName, children, showIcon = true }: CompanyLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <>
      <span 
        onClick={handleClick}
        className="inline-flex items-center gap-1 cursor-pointer hover:text-emerald-400 hover:underline decoration-emerald-400/30 underline-offset-4 transition-colors group"
      >
        {children || companyName}
        {showIcon && <Info size={14} className="text-slate-500 group-hover:text-emerald-400 transition-colors" opacity={0.7} />}
      </span>

      {isOpen && (
        <CompanyModal 
          companyName={companyName} 
          onClose={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
