import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface VerseRow {
  id: string;
  version: string;
  book: string;
  chapter: string;
  verse: string;
}

interface DropdownProps {
  label: string;
  items: string[];
  value: string;
  onSelect: (item: string) => void;
  labelWidth?: number;
}

function Dropdown({ label, items, value, onSelect, labelWidth = 80 }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={[styles.label, { width: labelWidth }]}>{label}</Text>
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.dropdownText}>{value || `Select ${label}`}</Text>
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
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function VerseRow({ verseRow, onUpdate, bibleVersions, bibleBooks, chapters, verses }: {
  verseRow: VerseRow;
  onUpdate: (field: keyof VerseRow, value: string) => void;
  bibleVersions: string[];
  bibleBooks: string[];
  chapters: string[];
  verses: string[];
}) {
  return (
    <View style={styles.rowContainer}>
      <Dropdown
        label="Version"
        items={bibleVersions}
        value={verseRow.version}
        onSelect={(value) => onUpdate('version', value)}
      />
      <Dropdown
        label="Book"
        items={bibleBooks}
        value={verseRow.book}
        onSelect={(value) => onUpdate('book', value)}
      />
      <Dropdown
        label="Chapter"
        items={chapters}
        value={verseRow.chapter}
        onSelect={(value) => onUpdate('chapter', value)}
      />
      <Dropdown
        label="Verse"
        items={verses}
        value={verseRow.verse}
        onSelect={(value) => onUpdate('verse', value)}
      />
    </View>
  );
}

export default function HomeScreen() {
  const bibleVersions = [
    'King James Version (KJV)',
    'New International Version (NIV)',
    'English Standard Version (ESV)',
    'New Living Translation (NLT)',
    'New King James Version (NKJV)',
  ];

  const bibleBooks = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
    'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
    'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
    'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts',
    'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
    '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
    '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
    'Jude', 'Revelation'
  ];

  const chapters = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
  const verses = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  const [verseRows, setVerseRows] = useState<VerseRow[]>([
    { id: '1', version: '', book: '', chapter: '', verse: '' }
  ]);

  const addNewRow = () => {
    const newId = (verseRows.length + 1).toString();
    setVerseRows([...verseRows, { id: newId, version: '', book: '', chapter: '', verse: '' }]);
  };

  const updateVerseRow = (rowId: string, field: keyof VerseRow, value: string) => {
    setVerseRows(verseRows.map(row => 
      row.id === rowId ? { ...row, [field]: value } : row
    ));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {verseRows.map((row) => (
          <VerseRow
            key={row.id}
            verseRow={row}
            onUpdate={(field, value) => updateVerseRow(row.id, field, value)}
            bibleVersions={bibleVersions}
            bibleBooks={bibleBooks}
            chapters={chapters}
            verses={verses}
          />
        ))}
        
        <TouchableOpacity style={styles.moreButton} onPress={addNewRow}>
          <Text style={styles.moreButtonText}>+ More</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  rowContainer: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 80,
  },
  dropdownButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginLeft: 10,
  },
  dropdownText: {
    fontSize: 14,
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
});
