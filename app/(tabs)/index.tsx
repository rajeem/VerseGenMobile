import { useEffect, useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { supabase } from '@/lib/supabase';

interface VerseRowData {
  id: string;
  versionId: string;
  bookId: string;
  chapter: string;
  verse: string;
}

interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  items: DropdownItem[];
  value: string;
  onSelect: (item: DropdownItem) => void;
  disabled?: boolean;
}

function Dropdown({ label, items, value, onSelect, disabled = false }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = items.find((item) => item.value === value)?.label ?? '';

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        style={[styles.dropdownButton, disabled && styles.dropdownButtonDisabled]} 
        onPress={() => {
          if (disabled) return;
          setIsOpen(true);
        }}
        disabled={disabled}
      >
        <Text style={styles.dropdownText}>{selectedLabel || `Select ${label}`}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={styles.scrollView}>
              {items.map((item) => (
                <TouchableOpacity
                  key={`${label}-${item.value}`}
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function VerseRow({ verseRow, onUpdate, onDelete, bibleVersions, bibleBooks, chapters, verses, isLastRow }: {
  verseRow: VerseRowData;
  onUpdate: (field: keyof VerseRowData, value: string) => void;
  onDelete: () => void;
  bibleVersions: DropdownItem[];
  bibleBooks: DropdownItem[];
  chapters: string[];
  verses: string[];
  isLastRow: boolean;
}) {
  const hasVersion = verseRow.versionId !== '';
  const hasBook = verseRow.bookId !== '';
  const hasChapter = verseRow.chapter !== '---';

  return (
    <View style={styles.rowContainer}>
      {!isLastRow && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>×</Text>
        </TouchableOpacity>
      )}
      <View style={styles.twoColumnLayout}>
        <View style={styles.column}>
          <Dropdown
            label="Version"
            items={bibleVersions}
            value={verseRow.versionId}
            onSelect={(item) => onUpdate('versionId', item.value)}
          />
          <Dropdown
            label="Chapter"
            items={chapters.map((c) => ({ label: c, value: c }))}
            value={verseRow.chapter}
            onSelect={(item) => onUpdate('chapter', item.value)}
            disabled={!hasVersion || !hasBook}
          />
        </View>
        <View style={styles.column}>
          <Dropdown
            label="Book"
            items={bibleBooks}
            value={verseRow.bookId}
            onSelect={(item) => onUpdate('bookId', item.value)}
            disabled={!hasVersion}
          />
          <Dropdown
            label="Verse"
            items={verses.map((v) => ({ label: v, value: v }))}
            value={verseRow.verse}
            onSelect={(item) => onUpdate('verse', item.value)}
            disabled={!hasVersion || !hasBook || !hasChapter}
          />
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [bibleVersions, setBibleVersions] = useState<DropdownItem[]>([]);
  const [bibleBooks, setBibleBooks] = useState<DropdownItem[]>([]);
  const [isLoadingReferenceData, setIsLoadingReferenceData] = useState(false);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);

  const [chaptersByRowId, setChaptersByRowId] = useState<Record<string, string[]>>({});
  const [versesByRowId, setVersesByRowId] = useState<Record<string, string[]>>({});
  const [bookIdsByVersionId, setBookIdsByVersionId] = useState<Record<string, string[]>>({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedVerses, setGeneratedVerses] = useState<string[]>([]);

  const getVersionLabel = (versionId: string) => bibleVersions.find((v) => v.value === versionId)?.label ?? '';
  const getBookLabel = (bookId: string) => bibleBooks.find((b) => b.value === bookId)?.label ?? '';

  useEffect(() => {
    let isMounted = true;

    const getRowLabel = (row: Record<string, unknown>) => {
      const candidate =
        row.name ??
        row.display_name ??
        row.title ??
        row.label ??
        row.code ??
        row.abbreviation ??
        row.id;
      return candidate == null ? '' : String(candidate);
    };

    const getRowId = (row: Record<string, unknown>) => {
      const candidate = row.id;
      return candidate == null ? '' : String(candidate);
    };

    const loadReferenceData = async () => {
      setIsLoadingReferenceData(true);
      setReferenceDataError(null);

      const [{ data: versions, error: versionsError }, { data: books, error: booksError }] = await Promise.all([
        supabase.from('versions').select('id,name'),
        supabase.from('books').select('id,name'),
      ]);

      if (!isMounted) return;

      if (versionsError || booksError) {
        setReferenceDataError((versionsError ?? booksError)?.message ?? 'Failed to load reference data');
        setBibleVersions([]);
        setBibleBooks([]);
        setIsLoadingReferenceData(false);
        return;
      }

      setBibleVersions(
        (versions ?? [])
          .map((row) => ({
            value: getRowId(row as Record<string, unknown>),
            label: getRowLabel(row as Record<string, unknown>),
          }))
          .filter((item) => item.value && item.label)
      );
      setBibleBooks(
        (books ?? [])
          .map((row) => ({
            value: getRowId(row as Record<string, unknown>),
            label: getRowLabel(row as Record<string, unknown>),
          }))
          .filter((item) => item.value && item.label)
      );
      setIsLoadingReferenceData(false);
    };

    loadReferenceData();

    return () => {
      isMounted = false;
    };
  }, []);

  const [verseRows, setVerseRows] = useState<VerseRowData[]>([
    { id: Date.now().toString(), versionId: '', bookId: '', chapter: '---', verse: '---' }
  ]);

  const addNewRow = () => {
    const newId = Date.now().toString();
    setVerseRows([...verseRows, { id: newId, versionId: '', bookId: '', chapter: '---', verse: '---' }]);
  };

  const deleteVerseRow = (rowId: string) => {
    setVerseRows(verseRows.filter(row => row.id !== rowId));
  };

  const updateVerseRow = (rowId: string, field: keyof VerseRowData, value: string) => {
    setVerseRows(verseRows.map(row => {
      if (row.id !== rowId) return row;

      if (field === 'versionId') {
        return { ...row, versionId: value, bookId: '', chapter: '---', verse: '---' };
      }

      if (field === 'bookId') {
        return { ...row, bookId: value, chapter: '---', verse: '---' };
      }

      if (field === 'chapter') {
        return { ...row, chapter: value, verse: '---' };
      }

      return { ...row, [field]: value };
    }));
  };

  useEffect(() => {
    let isMounted = true;

    const loadBooksForVersion = async (versionId: string) => {
      const { data, error } = await supabase
        .from('verses')
        .select('book_id')
        .eq('version_id', Number(versionId))
        .not('book_id', 'is', null)
        .order('book_id', { ascending: true });

      if (!isMounted) return;

      if (error) {
        setBookIdsByVersionId((prev) => ({ ...prev, [versionId]: [] }));
        return;
      }

      const unique = Array.from(
        new Set((data ?? []).map((row) => String((row as Record<string, unknown>).book_id)).filter(Boolean))
      );
      setBookIdsByVersionId((prev) => ({ ...prev, [versionId]: unique }));
    };

    const versionIds = Array.from(new Set(verseRows.map((r) => r.versionId).filter(Boolean)));
    versionIds.forEach((versionId) => {
      if (bookIdsByVersionId[versionId]) return;
      void loadBooksForVersion(versionId);
    });

    return () => {
      isMounted = false;
    };
  }, [bookIdsByVersionId, verseRows]);

  useEffect(() => {
    let isMounted = true;

    const loadChapters = async (rowId: string, versionId: string, bookId: string) => {
      const { data, error } = await supabase
        .from('verses')
        .select('chapter')
        .eq('version_id', Number(versionId))
        .eq('book_id', Number(bookId))
        .not('chapter', 'is', null)
        .order('chapter', { ascending: true });

      if (!isMounted) return;

      if (error) {
        setChaptersByRowId((prev) => ({ ...prev, [rowId]: [] }));
        return;
      }

      const unique = Array.from(
        new Set((data ?? []).map((row) => String((row as Record<string, unknown>).chapter)).filter((c) => c !== 'null'))
      );
      setChaptersByRowId((prev) => ({ ...prev, [rowId]: unique }));
    };

    const loadVerses = async (rowId: string, versionId: string, bookId: string, chapter: string) => {
      const { data, error } = await supabase
        .from('verses')
        .select('verse')
        .eq('version_id', Number(versionId))
        .eq('book_id', Number(bookId))
        .eq('chapter', Number(chapter))
        .not('verse', 'is', null)
        .order('verse', { ascending: true });

      if (!isMounted) return;

      if (error) {
        setVersesByRowId((prev) => ({ ...prev, [rowId]: [] }));
        return;
      }

      const unique = Array.from(
        new Set((data ?? []).map((row) => String((row as Record<string, unknown>).verse)).filter((v) => v !== 'null'))
      );
      setVersesByRowId((prev) => ({ ...prev, [rowId]: unique }));
    };

    verseRows.forEach((row) => {
      if (row.versionId && row.bookId) {
        void loadChapters(row.id, row.versionId, row.bookId);
      } else {
        setChaptersByRowId((prev) => ({ ...prev, [row.id]: [] }));
      }

      if (row.versionId && row.bookId && row.chapter !== '---') {
        void loadVerses(row.id, row.versionId, row.bookId, row.chapter);
      } else {
        setVersesByRowId((prev) => ({ ...prev, [row.id]: [] }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [verseRows]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedVerses([]);

    const invalidIndex = verseRows.findIndex(
      (r) => !r.versionId || !r.bookId || r.chapter === '---' || r.verse === '---'
    );

    if (invalidIndex !== -1) {
      const invalid = verseRows[invalidIndex];
      const missing: string[] = [];
      if (!invalid.versionId) missing.push('Version');
      if (!invalid.bookId) missing.push('Book');
      if (invalid.chapter === '---') missing.push('Chapter');
      if (invalid.verse === '---') missing.push('Verse');
      setGenerateError(`Row ${invalidIndex + 1}: please complete ${missing.join(', ')}.`);
      setIsGenerating(false);
      return;
    }

    const results = await Promise.all(
      verseRows.map(async (row) => {
        const { data, error } = await supabase
          .from('verses')
          .select('text')
          .eq('version_id', Number(row.versionId))
          .eq('book_id', Number(row.bookId))
          .eq('chapter', Number(row.chapter))
          .eq('verse', Number(row.verse))
          .maybeSingle();

        if (error) {
          return `${getVersionLabel(row.versionId)} ${getBookLabel(row.bookId)} ${row.chapter}:${row.verse} — ${error.message}`;
        }

        const text = (data as { text?: string | null } | null)?.text ?? '';
        return `${getVersionLabel(row.versionId)} ${getBookLabel(row.bookId)} ${row.chapter}:${row.verse} — ${text}`;
      })
    );

    setGeneratedVerses(results);
    setIsGenerating(false);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Verse Generator</Text>
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {isLoadingReferenceData && (
            <Text style={styles.loadingText}>Loading versions and books...</Text>
          )}
          {!!referenceDataError && (
            <Text style={styles.errorText}>{referenceDataError}</Text>
          )}
          {!!generateError && (
            <Text style={styles.errorText}>{generateError}</Text>
          )}
          {verseRows.map((row, index) => (
            <VerseRow
              key={row.id}
              verseRow={row}
              onUpdate={(field, value) => updateVerseRow(row.id, field, value)}
              onDelete={() => deleteVerseRow(row.id)}
              bibleVersions={bibleVersions}
              bibleBooks={
                row.versionId
                  ? bibleBooks.filter((b) => (bookIdsByVersionId[row.versionId] ?? []).includes(b.value))
                  : []
              }
              chapters={chaptersByRowId[row.id] ?? []}
              verses={versesByRowId[row.id] ?? []}
              isLastRow={index === verseRows.length - 1}
            />
          ))}
          
          <TouchableOpacity style={styles.moreButton} onPress={addNewRow}>
            <Text style={styles.moreButtonText}>+ More</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={isGenerating}>
            <Text style={styles.generateButtonText}>{isGenerating ? 'Generating...' : 'Generate'}</Text>
          </TouchableOpacity>

          {generatedVerses.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Results</Text>
              {generatedVerses.map((line, idx) => (
                <View key={`result-${idx}`} style={styles.resultItem}>
                  <Text style={styles.resultText}>{line}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#0051D5',
  },
  toolbarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  loadingText: {
    marginBottom: 10,
    color: '#666',
    fontSize: 12,
  },
  errorText: {
    marginBottom: 10,
    color: '#FF3B30',
    fontSize: 12,
  },
  rowContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    position: 'relative',
  },
  twoColumnLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  dropdownButton: {
    flex: 1,
    height: 32,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  dropdownButtonDisabled: {
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 12,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
    width: '90%',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  scrollView: {
    maxHeight: 400,
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  resultsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  resultItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 14,
    color: '#333',
  },
  moreButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  moreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
