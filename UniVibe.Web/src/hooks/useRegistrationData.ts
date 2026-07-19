import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ItemModel, ModalType } from '../types/auth.types';

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
    api.get("/University")
      .then((res: any) => setUniversities(res.data || res))
      .catch(() => setUniversities([]));
  }, []);

  useEffect(() => {
    if (selectedUni) {
      api.get(`/University/${selectedUni.id}/faculties`)
        .then((res: any) => setFaculties(res.data || res))
        .catch(() => setFaculties([]));
    } else {
      setFaculties([]);
    }
  }, [selectedUni]);

  useEffect(() => {
    if (selectedFac) {
      api.get(`/University/faculties/${selectedFac.id}/departments`)
        .then((res: any) => setDepartments(res.data || res))
        .catch(() => setDepartments([]));
    } else {
      setDepartments([]);
    }
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
    if (modalType === 'grade') setGrade(item);
    else if (modalType === 'uni') { 
      setSelectedUni(item); 
      setSelectedFac(null); 
      setSelectedDep(null); 
    }
    else if (modalType === 'fac') { 
      setSelectedFac(item); 
      setSelectedDep(null); 
    }
    else if (modalType === 'dep') {
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
    setModalType,
    setIsModalOpen,
    getModalData,
    handleSelectModalItem,
  };
}