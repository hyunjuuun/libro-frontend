import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { ReadingRecord } from '../types/readingRecord';
import api from '@/api/apiClient';
import { BackButton, Button } from '../components/common';

const DetailContainer = styled.div`
  padding: ${theme.spacing.lg};
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;



const BookInfo = styled.div`
  text-align: center;
  padding: ${theme.spacing.xl} 0;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background: ${theme.colors.primary};
    border-radius: 2px;
  }
`;

const BookTitle = styled.h1`
  font-size: 2.5rem;
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing.md};
  font-weight: 700;
  line-height: 1.2;
`;

const BookAuthor = styled.p`
  font-size: 1.2rem;
  color: ${theme.colors.text.secondary};
  font-weight: 500;
`;

const Section = styled.section`
  margin-bottom: ${theme.spacing.xl};
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: ${theme.colors.text.primary};
  font-weight: 600;
`;

const Content = styled.div`
  background: ${theme.colors.background.white};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.sm};
  position: relative;
  min-height: 200px;
  display: flex;
  flex-direction: column;
`;

const RecordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.xl};
  flex: 1;
`;

const RecordItem = styled.div`
  padding: ${theme.spacing.md};
  background: ${theme.colors.background.light};
  border-radius: ${theme.borderRadius.sm};
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  transition: transform ${theme.transitions.default};
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${theme.spacing.md};

  &:hover {
    transform: translateX(4px);
  }
`;

const RecordContent = styled.div`
  flex: 1;
`;

const RecordDeleteButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.text.light};
  cursor: pointer;
  padding: ${theme.spacing.xs};
  font-size: 1.2rem;
  line-height: 1;
  opacity: 0;
  transition: all 0.2s ease;

  ${RecordItem}:hover & {
    opacity: 1;
  }

  &:hover {
    color: ${theme.colors.error};
  }
`;

const AddButtonWrapper = styled.div`
  margin-top: auto;
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  display: flex;
  justify-content: center;
`;



const AddButton = styled(Button)`
  width: 100%;
  max-width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  font-weight: 600;
  box-shadow: ${theme.shadows.sm};
`;

const RecordForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  animation: fadeIn 0.2s ease-in-out;
  flex: 1;
  background: ${theme.colors.background.white};

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: ${theme.spacing.md};
  border: none;
  font-size: 1rem;
  line-height: 1.6;
  resize: vertical;
  font-family: inherit;
  background: transparent;
  flex: 1;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${theme.colors.text.light};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
  margin-top: auto;
  padding-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const EmptyMessage = styled.p`
  color: ${theme.colors.text.secondary};
  text-align: center;
  padding: ${theme.spacing.xl} 0;
`;

const StatusToggle = styled.button`
  display: block;
  margin: ${theme.spacing.md} auto 0; /* 중앙 정렬 및 위쪽 간격 */
  background: ${theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s ease;

  &:hover {
    background: ${theme.colors.primaryDark};
  }
`;

interface Record {
  id: number;
  content: string;
  createdAt: string;
  pageNumber?: number;
}

const ReadingRecordDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Record[]>([]);
  const [newRecord, setNewRecord] = useState('');
  const [newPageNumber, setNewPageNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [readingRecord, setReadingRecord] = useState<ReadingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingStatus, setReadingStatus] = useState<'WANT_TO_READ' | 'READING' | 'DONE'>('WANT_TO_READ');

  const statusLabels = {
    WANT_TO_READ: '읽고 싶어요',
    READING: '읽는 중',
    DONE: '완료'
  };

  const nextStatus = {
    WANT_TO_READ: 'READING',
    READING: 'DONE',
    DONE: 'WANT_TO_READ'
  };

  useEffect(() => {
    const fetchReadingRecord = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/reading-records/${id}`);
        setReadingRecord(response.data);
        setError(null);
      } catch (err) {
        setError('도서 정보를 불러오는데 실패했습니다.');
        console.error('Error fetching reading record:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchReadingNotes = async () => {
      try {
        const response = await api.get(`/reading-records/${id}/notes`);
        setRecords(response.data);
      } catch (err) {
        console.error('Error fetching reading notes:', err);
      }
    };

    if (id) {
      fetchReadingRecord();
      fetchReadingNotes();
    }
  }, [id]);

  if (isLoading) {
    return (
      <DetailContainer>
        <Header>
          <BackButton onClick={() => navigate('/reading-record')} />
        </Header>
        <div>로딩 중...</div>
      </DetailContainer>
    );
  }

  if (error || !readingRecord) {
    return (
      <DetailContainer>
        <Header>
          <BackButton onClick={() => navigate('/reading-record')} />
        </Header>
        <div style={{ color: 'red' }}>{error || '도서를 찾을 수 없습니다.'}</div>
      </DetailContainer>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.trim()) return;
    const pageNumber = newPageNumber.trim() ? parseInt(newPageNumber.trim(), 10) : undefined;
    try {
      const response = await api.post(`/reading-records/${id}/note`, {
        content: newRecord.trim(),
        pageNumber
      });
      const record: Record = {
        id: response.data.id,
        content: newRecord.trim(),
        createdAt: new Date().toISOString(),
        pageNumber: pageNumber,
      };
      setRecords((prev) => [...prev, record]);
      setNewRecord('');
      setNewPageNumber('');
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving reading note:', err);
      // TODO: Add error handling UI feedback
    }
  };

  const handleCancel = () => {
    setNewRecord('');
    setIsEditing(false);
  };

  const handleDeleteRecord = async (recordId: number) => {
    if (!window.confirm('이 기록을 정말로 삭제하시겠습니까?')) {
      return;
    }

    try {
      await api.delete(`/reading-records/${id}/notes/${recordId}`);
      setRecords(records.filter(record => record.id !== recordId));
    } catch (err) {
      console.error('Error deleting reading note:', err);
      // TODO: Add error handling UI feedback
    }
  };

  const handleStatusToggle = async (event: React.MouseEvent) => {
    event.stopPropagation();

    setReadingStatus(prev => nextStatus[prev] as 'WANT_TO_READ' | 'READING' | 'DONE');
  };

  return (
    <DetailContainer>
      <Header>
        <BackButton onClick={() => navigate('/reading-record')} />
        <BookInfo>
          <BookTitle>{readingRecord.bookTitle}</BookTitle>
          <BookAuthor>{readingRecord.bookAuthor}</BookAuthor>
          <StatusToggle onClick={(e) => handleStatusToggle(e)}>
            {statusLabels[readingStatus]}
          </StatusToggle>
        </BookInfo>
      </Header>

      <Section>
        <SectionHeader>
          <SectionTitle>기록</SectionTitle>
        </SectionHeader>
        <Content>
          {isEditing ? (
            <RecordForm onSubmit={handleSubmit}>
              <TextArea
                value={newRecord}
                onChange={(e) => setNewRecord(e.target.value)}
                placeholder="독서 기록을 작성해보세요..."
                autoFocus
              />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                value={newPageNumber}
                onChange={e => setNewPageNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="몇 페이지에 대한 기록인가요? (예: 10)"
                style={{ padding: '12px', fontSize: '1rem', borderRadius: '6px', border: '1px solid #eee' }}
                autoComplete="off"
                maxLength={5}
              />
              <ButtonGroup>
                <Button type="button" onClick={handleCancel}>
                  취소
                </Button>
                <Button type="submit" variant="primary">
                  저장
                </Button>
              </ButtonGroup>
            </RecordForm>
          ) : (
            <>
              {records.length > 0 ? (
                <RecordList>
                  {records.map((record) => (
                    <RecordItem key={record.id}>
                      <RecordContent>
                        {record.pageNumber ? <span style={{ color: '#888', fontSize: '0.95em', marginRight: 8 }}>[p.{record.pageNumber}]</span> : null}
                        {record.content}
                      </RecordContent>
                      <RecordDeleteButton onClick={() => handleDeleteRecord(record.id)}>×</RecordDeleteButton>
                    </RecordItem>
                  ))}
                </RecordList>
              ) : (
                <EmptyMessage>아직 작성된 기록이 없습니다.</EmptyMessage>
              )}
              <AddButtonWrapper>
                <AddButton onClick={() => setIsEditing(true)}>
                  + 기록 추가
                </AddButton>
              </AddButtonWrapper>
            </>
          )}
        </Content>
      </Section>
    </DetailContainer>
  );
};

export default ReadingRecordDetail;
