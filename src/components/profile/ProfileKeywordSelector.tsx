"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError } from "./FieldError";
import {
  KEYWORDS_TREE,
  PARENTS_WITHOUT_DETAIL,
  TOP_LEVEL_KEYWORDS,
} from "@/lib/profileConfig";
import type { ProfileFormValues } from "@/types/profile";

type Props = {
  form: UseFormReturn<ProfileFormValues>;
};

export function ProfileKeywordSelector({ form }: Props) {
  const keywords = form.watch("keywords");
  const [keywordModalParent, setKeywordModalParent] = React.useState<string | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const safeKeywords = React.useMemo(() => keywords ?? [], [keywords]);

  const toggleKeyword = React.useCallback(
    (keyword: string) => {
      const set = new Set(form.getValues("keywords"));
      if (set.has(keyword)) set.delete(keyword);
      else set.add(keyword);
      const next = Array.from(set);
      form.setValue("keywords", next, { shouldValidate: true });
      if (next.length > 0) form.clearErrors("keywords");
    },
    [form]
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

  const closeModal = () => setModalOpen(false);

  const handleToggleAll = React.useCallback(() => {
    if (!keywordModalParent) return;
    const children = KEYWORDS_TREE[keywordModalParent] ?? [];
    const allSelected = children.every((child) => safeKeywords.includes(child));
    if (allSelected) {
      const filtered = safeKeywords.filter((kw) => !children.includes(kw));
      form.setValue("keywords", filtered, { shouldValidate: true });
    } else {
      const merged = new Set(safeKeywords.concat(children));
      form.setValue("keywords", Array.from(merged), { shouldValidate: true });
    }
  }, [keywordModalParent, safeKeywords, form]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">관심 키워드</p>
        <span className="text-xs text-gray-500">최소 1개 이상 선택</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOP_LEVEL_KEYWORDS.map((parent) => {
          const active = safeKeywords.includes(parent);
          return (
            <Button
              key={parent}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              className={active ? "bg-blue-600 hover:bg-blue-700" : "text-gray-700"}
              onClick={() => openKeywordModal(parent)}
            >
              {parent}
            </Button>
          );
        })}
      </div>

      <SelectedKeywords keywords={safeKeywords} onRemove={toggleKeyword} />
      <FieldError message={form.formState.errors.keywords?.message} />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{keywordModalParent ?? ""}</DialogTitle>
            <DialogDescription>
              세부 키워드를 선택해 관심 있는 공지를 더 정확하게 추천받으세요.
            </DialogDescription>
          </DialogHeader>

          <KeywordModalBody
            parent={keywordModalParent}
            keywords={safeKeywords}
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
