import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ItemModel, ModalType } from '../types/auth.types';

export function parseLookupArray(res: unknown): ItemModel[] {
  if (!res) return [];

  let rawList: unknown = res;

  // Unwrap any nested data: response.data, response.data.data, items, etc.
  while (rawList && typeof rawList === 'object' && !Array.isArray(rawList)) {
    const obj = rawList as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      rawList = obj.data;
    } else if (Array.isArray(obj.items)) {
      rawList = obj.items;
    } else if (Array.isArray(obj.$values)) {
      rawList = obj.$values;
    } else if (obj.data && typeof obj.data === 'object') {
      rawList = obj.data;
    } else {
      break;
    }
  }

  if (!Array.isArray(rawList)) return [];

  return rawList
    .map((item: unknown): ItemModel | null => {
      if (!item || typeof item !== 'object') return null;
      const rec = item as Record<string, unknown>;
      const id =
        rec.id ??
        rec.Id ??
        rec.universityId ??
        rec.UniversityId ??
        rec.facultyId ??
        rec.FacultyId ??
        rec.departmentId ??
        rec.DepartmentId ??
        rec.value ??
        rec.Value;
      const name =
        rec.name ??
        rec.Name ??
        rec.title ??
        rec.Title ??
        rec.label ??
        rec.Label ??
        '';

      if (id === undefined || id === null) return null;
      return {
        id: id as string | number,
        name: String(name),
      };
    })
    .filter((item): item is ItemModel => item !== null && item.name.trim().length > 0);
}

export function useRegistrationData(t: (key: string) => string) {
  const GRADES: ItemModel[] = [
    { id: 0, name: t("Grade_Prep") },
    { id: 1, name: t("Grade_1") },
    { id: 2, name: t("Grade_2") },
    { id: 3, name: t("Grade_3") },
    { id: 4, name: t("Grade_4") },
    { id: 5, name: t("Grade_5") },
    { id: 6, name: t("Grade_6") },
    { id: 7, name: t("Grade_Graduated") },
  ];

  const [universities, setUniversities] = useState<ItemModel[]>([]);
  const [faculties, setFaculties] = useState<ItemModel[]>([]);
  const [departments, setDepartments] = useState<ItemModel[]>([]);

  const [selectedUni, setSelectedUni] = useState<ItemModel | null>(null);
  const [selectedFac, setSelectedFac] = useState<ItemModel | null>(null);
  const [selectedDep, setSelectedDep] = useState<ItemModel | null>(null);
  const [grade, setGrade] = useState<ItemModel | null>(null);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get("/universities")
      .then((res: unknown) => {
        if (isMounted) {
          setUniversities(parseLookupArray(res));
        }
      })
      .catch(() => {
        if (isMounted) setUniversities([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (selectedUni && selectedUni.id) {
      setFaculties([]);
      api.get(`/universities/${selectedUni.id}/faculties`)
        .then((res: unknown) => {
          if (isMounted) {
            setFaculties(parseLookupArray(res));
          }
        })
        .catch(() => {
          if (isMounted) setFaculties([]);
        });
    } else {
      setFaculties([]);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedUni]);

  useEffect(() => {
    let isMounted = true;
    if (selectedFac && selectedFac.id) {
      setDepartments([]);
      api.get(`/universities/faculties/${selectedFac.id}/departments`)
        .then((res: unknown) => {
          if (isMounted) {
            setDepartments(parseLookupArray(res));
          }
        })
        .catch(() => {
          if (isMounted) setDepartments([]);
        });
    } else {
      setDepartments([]);
    }
    return () => {
      isMounted = false;
    };
  }, [selectedFac]);

  const getModalData = (): ItemModel[] => {
    switch (modalType) {
      case 'grade': return GRADES;
      case 'uni': return universities;
      case 'fac': return faculties;
      case 'dep': return departments;
      default: return [];
    }
  };

  const handleSelectModalItem = (item: ItemModel) => {
    if (modalType === 'grade') {
      setGrade(item);
    } else if (modalType === 'uni') { 
      setSelectedUni(item); 
      setSelectedFac(null); 
      setSelectedDep(null);
      setFaculties([]);
      setDepartments([]);
    } else if (modalType === 'fac') { 
      setSelectedFac(item); 
      setSelectedDep(null);
      setDepartments([]);
    } else if (modalType === 'dep') {
      setSelectedDep(item);
    }
    setIsModalOpen(false);
  };

  return {
    GRADES,
    universities,
    faculties,
    departments,
    selectedUni,
    selectedFac,
    selectedDep,
    grade,
    modalType,
    isModalOpen,
    setSelectedUni,
    setSelectedFac,
    setSelectedDep,
    setGrade,
    setModalType,
    setIsModalOpen,
    getModalData,
    handleSelectModalItem,
  };
}
