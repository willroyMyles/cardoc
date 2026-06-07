import {
  DocumentSourceSheet,
  type DocumentSource,
} from "@/components/documents/document-source-sheet";
import React from "react";
import { Platform } from "react-native";

type DocumentImportSheetProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSelect: (source: DocumentSource) => void;
};

export function DocumentImportSheet({
  visible,
  title = "Add document",
  subtitle = "Choose where to import the document from.",
  onClose,
  onSelect,
}: DocumentImportSheetProps) {
  const photosLabel = Platform.OS === "ios" ? "Photos" : "Gallery";

  return (
    <DocumentSourceSheet
      visible={visible}
      title={title}
      subtitle={subtitle}
      options={[
        {
          source: "gallery",
          label: photosLabel,
          description: "Choose one or more images",
        },
        {
          source: "files",
          label: "Files",
          description: "Choose a document or image",
        },
        {
          source: "camera",
          label: "Camera",
          description: "Scan with the live camera",
        },
      ]}
      onClose={onClose}
      onSelect={onSelect}
    />
  );
}

export type { DocumentSource };
