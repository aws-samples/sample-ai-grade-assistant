import { DeleteConfirmationDialog } from '@aws-northstar/ui';
import Table from '@aws-northstar/ui/components/Table';
import {
  Button,
  ButtonDropdown,
  ContentLayout,
  Header,
  Link,
  SpaceBetween,
  TextContent,
} from '@cloudscape-design/components';
import moment from 'moment';
import { useEffect, useState } from 'react';

import { useBreadcrumb } from '../../../../hooks/useBreadcrumb';
import { useDeleteUsers, useGetUsers } from '../../hooks';
import { User } from '../../types';

export const ListUsers = () => {
  const setBreadcrumb = useBreadcrumb();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);

  const { data: users, isFetching, refetch } = useGetUsers();
  const { mutateAsync: deleteUsers, isLoading: isDeleting } = useDeleteUsers();

  const init = async () => {
    setBreadcrumb([
      { text: 'Home', href: '/' },
      { text: 'Users', href: '/users' },
    ]);
  };

  const handleDelete = async () => {
    const userIds = selectedUsers.map((user) => user.id);
    await deleteUsers(userIds);
    setSelectedUsers([]);
    setDeleteModalVisible(false);
  };

  useEffect(() => {
    init();
  }, []);

  const columnDefinitions = [
    {
      id: 'email',
      header: 'Email',
      sortingField: 'email',
      cell: (user: User) => (
        <span className="text-link">
          <Link onFollow={() => {}}>{user.email}</Link>
        </span>
      ),
    },
    {
      id: 'name',
      header: 'Name',
      sortingField: 'name',
      cell: (user: User) => user.name,
    },
    {
      id: 'createdOn',
      header: 'Added',
      sortingField: 'createdOn',
      cell: (user: User) => <>{moment(user.date_created).fromNow()}</>,
    },
    {
      id: 'lastModifiedOn',
      header: 'Last Modified',
      sortingField: 'lastModifiedOn',
      cell: (user: User) => <>{moment(user.date_last_modified).fromNow()}</>,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectionChange = ({ detail }: { detail: any }) => {
    const users = detail.selectedItems as User[];
    setSelectedUsers(users);
  };

  return (
    <ContentLayout
      header={
        <Header variant="h1" description="Manage who has access to this application.">
          Users
        </Header>
      }
    >
      <Table
        stripedRows
        trackBy="userId"
        columnDefinitions={columnDefinitions}
        header="Users"
        totalItemsCount={(users || []).length}
        items={users || []}
        selectedItems={selectedUsers}
        onSelectionChange={handleSelectionChange}
        loading={isFetching}
        actions={
          <SpaceBetween direction="horizontal" size="s">
            <Button iconName="refresh" onClick={() => refetch()} disabled={isFetching} />
            <ButtonDropdown
              disabled={selectedUsers.length === 0}
              items={[{ text: 'Delete', id: 'delete' }]}
              onItemClick={({ detail }) => {
                if (detail.id === 'delete') {
                  setDeleteModalVisible(true);
                }
              }}
            >
              Actions
            </ButtonDropdown>
          </SpaceBetween>
        }
      />
      <DeleteConfirmationDialog
        variant="confirmation"
        visible={isDeleteModalVisible}
        title="Remove users"
        onCancelClicked={() => setDeleteModalVisible(false)}
        onDeleteClicked={handleDelete}
        loading={isDeleting}
      >
        <TextContent>Are you sure you want to remove these user(s)?</TextContent>
      </DeleteConfirmationDialog>
    </ContentLayout>
  );
};

export default ListUsers;
