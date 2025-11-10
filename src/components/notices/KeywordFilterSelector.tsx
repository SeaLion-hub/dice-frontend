"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  KEYWORDS_TREE,
  PARENTS_WITHOUT_DETAIL,
  TOP_LEVEL_KEYWORDS,
} from "@/lib/profileConfig";

type KeywordFilterSelectorProps = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function KeywordFilterSelector({ value, onChange }: KeywordFilterSelectorProps) {
  const selected = React.useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const [keywordModalParent, setKeywordModalParent] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const toggleKeyword = React.useCallback(
    (keyword: string) => {
      const next = new Set(selected);
      if (next.has(keyword)) next.delete(keyword);
      else next.add(keyword);
      onChange(Array.from(next));
    },
    [selected, onChange]
  );

  const openKeywordModal = React.useCallback(
    (parent: string) => {
      const children = KEYWORDS_TREE[parent] ?? [];
      const noDetail = children.length === 0 || PARENTS_WITHOUT_DETAIL.includes(parent);
      if (noDetail) {
        toggleKeyword(parent);
        return;
      }
      setKeywordModalParent(parent);
      setModalOpen(true);
    },
    [toggleKeyword]
  );

  const closeModal = React.useCallback(() => setModalOpen(false), []);

  const handleToggleAll = React.useCallback(() => {
    if (!keywordModalParent) return;
    const children = KEYWORDS_TREE[keywordModalParent] ?? [];
    const allSelected = children.length > 0 && children.every((child) => selected.includes(child));
    if (allSelected) {
      const filtered = selected.filter((kw) => !children.includes(kw));
      onChange(filtered);
    } else {
      const merged = new Set(selected.concat(children));
      onChange(Array.from(merged));
    }
  }, [keywordModalParent, selected, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TOP_LEVEL_KEYWORDS.map((parent) => {
          const active = selected.includes(parent);
          const children = KEYWORDS_TREE[parent] ?? [];
          const hasSelectedChild = children.some((child) => selected.includes(child));
          const isActive = active || hasSelectedChild;
          return (
            <Button
              key={parent}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={isActive ? "bg-blue-600 hover:bg-blue-700" : "text-gray-700"}
              onClick={() => openKeywordModal(parent)}
            >
              {parent}
            </Button>
          );
        })}
      </div>

      <SelectedKeywords keywords={selected} onRemove={toggleKeyword} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{keywordModalParent ?? ""}</DialogTitle>
            <DialogDescription>
              세부 키워드를 선택해 원하는 공지를 필터링하세요.
            </DialogDescription>
          </DialogHeader>

          <KeywordModalBody
            parent={keywordModalParent}
            keywords={selected}
            onToggleOne={toggleKeyword}
            onToggleAll={handleToggleAll}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeModal}>
              닫기
            </Button>
            <Button type="button" onClick={closeModal}>
              적용
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SelectedKeywords({
  keywords,
  onRemove,
}: {
  keywords: string[];
  onRemove: (kw: string) => void;
}) {
  if (!keywords || keywords.length === 0) {
    return <p className="text-xs text-gray-500">선택된 키워드가 없습니다.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword) => (
        <span
          key={keyword}
          className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
        >
          {keyword}
          <button
            type="button"
            className="text-blue-500 hover:text-blue-700"
            aria-label={`${keyword} 제거`}
            onClick={() => onRemove(keyword)}
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}

function KeywordModalBody({
  parent,
  keywords,
  onToggleOne,
  onToggleAll,
}: {
  parent: string | null;
  keywords: string[];
  onToggleOne: (kw: string) => void;
  onToggleAll: () => void;
}) {
  if (!parent) return null;
  const children = KEYWORDS_TREE[parent] ?? [];
  const allSelected = children.length > 0 && children.every((child) => keywords.includes(child));

  if (children.length === 0) {
    return <p className="text-sm text-gray-600">세부 키워드가 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">세부 키워드</p>
        <Button type="button" variant="outline" size="sm" onClick={onToggleAll}>
          {allSelected ? "전체 해제" : "전체 선택"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {children.map((child) => {
          const selected = keywords.includes(child);
          return (
            <Button
              key={child}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              className={selected ? "bg-blue-600 hover:bg-blue-700" : "text-gray-700"}
              onClick={() => onToggleOne(child)}
            >
              {child}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

