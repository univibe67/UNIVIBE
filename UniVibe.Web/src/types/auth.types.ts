export interface LoginResponse {
  token: string;
  refreshToken: string;
}
export type ModalType = 'grade' | 'uni' | 'fac' | 'dep' | null;

export interface ItemModel {
  id: number | string;
  name: string;
}