import {
  Box,
  Button,
  Container,
  SpaceBetween,
  Spinner,
} from '@cloudscape-design/components';
import moment from 'moment';
import { FaFile, FaFilePdf, FaFileWord } from 'react-icons/fa';

import { formatBytes } from '../../../helpers/util';
import { useGetSettings } from '../../settings/hooks';
import { MoodleSettings } from '../../settings/types';
import { SubmittedDocument } from '../types';

interface SubmissionsTableProps {
  submittedDocument: SubmittedDocument;
}

export const SubmissionAttachment = ({ submittedDocument }: SubmissionsTableProps) => {
  const { data: settings, isFetching: isLoadingSettings } = useGetSettings('moodle');
  const settingsMoodle = settings as MoodleSettings;

  const openAttachment = () =>
    window.open(`${submittedDocument.fileUrl}?token=${settingsMoodle.moodleToken}`);

  const FileIcon = ({ mimeTypeDoc }: { mimeTypeDoc: string }) => {
    switch (mimeTypeDoc) {
      case 'application/pdf':
        return <FaFilePdf className="attachment-icon" />;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return <FaFileWord className="attachment-icon" />;
      default:
        return <FaFile className="attachment-icon" />;
    }
  };

  if (isLoadingSettings) {
    return (
      <Container>
        <SpaceBetween size="xs" direction="horizontal" alignItems="center">
          <Spinner size="big" />
          <Box>Loading...</Box>
        </SpaceBetween>
      </Container>
    );
  }

  return (
    <Container>
      <SpaceBetween size="s" direction="horizontal" alignItems="center">
        <Button variant="inline-link" onClick={openAttachment}>
          <FileIcon mimeTypeDoc={submittedDocument.mimeType} />
        </Button>
        <div>
          <Button variant="inline-link" onClick={openAttachment}>
            {submittedDocument.fileName}
          </Button>
          <div>
            <small>{formatBytes(submittedDocument.fileSize)}</small>
          </div>
          <div>
            <small>
              Uploaded {moment(submittedDocument.timeModified * 1000).fromNow()}
            </small>
          </div>
        </div>
      </SpaceBetween>
    </Container>
  );
};

export default SubmissionAttachment;
