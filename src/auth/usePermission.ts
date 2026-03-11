import { useEffect, useMemo, useState } from 'react';
import {
  PERMISSION_EVENT,
  guardPermission,
  hasAnyPermission,
  hasPermission,
  readPermissionKeys,
  readPermissionKeySet,
} from './permissions';

const toSet = (keys: string[]) => new Set(keys);

export const usePermission = () => {
  const [permissionKeys, setPermissionKeys] = useState<string[]>(() => readPermissionKeys());

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== 'ems_permission_keys') return;
      setPermissionKeys(readPermissionKeys());
    };
    const handlePermissionEvent = () => {
      setPermissionKeys(readPermissionKeys());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(PERMISSION_EVENT, handlePermissionEvent as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(PERMISSION_EVENT, handlePermissionEvent as EventListener);
    };
  }, []);

  const permissionSet = useMemo(() => toSet(permissionKeys), [permissionKeys]);

  return {
    permissionKeys,
    permissionSet,
    hasPermission: (permissionKey: string) => hasPermission(permissionKey, permissionSet),
    hasAnyPermission: (permissionList: string[]) => hasAnyPermission(permissionList, permissionSet),
    guardPermission: (permissionKey: string, actionLabel: string, notifier?: (message: string) => void) =>
      guardPermission(permissionKey, actionLabel, permissionSet, notifier),
    refreshPermissionSnapshot: () => setPermissionKeys(Array.from(readPermissionKeySet())),
  };
};
