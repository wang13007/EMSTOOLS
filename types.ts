
export enum UserType {
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

export enum UserStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled'
}

export enum LogType {
  LOGIN = 'login',
  SURVEY = 'survey',
  USER = 'user',
  SYSTEM = 'system'
}

export enum OperationResult {
  SUCCESS = '成功',
  FAILURE = '失败'
}

export enum ProductType {
  SOFTWARE = '软件',
  HARDWARE = '硬件',
  CONSULTING = '咨询'
}

export enum SurveyStatus {
  DRAFT = '草稿',
  FILLING = '填写中',
  COMPLETED = '已完成'
}

export enum ReportStatus {
  NOT_GENERATED = '未生成',
  GENERATED = '已生成'
}

export enum DictStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled'
}

export interface DictType {
  typeId: string;
  typeName: string;
  typeCode: string;
  description?: string;
  status: DictStatus;
  sortOrder?: number;
  createTime: string;
  creator: string;
}

export interface DictItem {
  itemId: string;
  typeId: string;
  itemLabel: string;
  itemValue: string;
  sortOrder?: number;
  status: DictStatus;
  ext1?: string;
  ext2?: string;
  createTime: string;
  creator: string;
}

export enum RegionLevel {
  COUNTRY = 1,
  REGION = 2,
  PROVINCE = 3,
  CITY = 4
}

export interface RegionDict {
  regionId: string;
  regionName: string;
  regionCode: string;
  parentId?: string;
  regionLevel: RegionLevel;
  sortOrder?: number;
  status: DictStatus;
  isSystem: boolean;
  createTime: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  type: UserType;
  role: string;
  customer?: string;
  status: UserStatus;
  createTime: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  type: UserType;
  permissions: Record<string, boolean>;
  status: UserStatus;
  createTime: string;
}

export interface ProductCapability {
  id: string;
  name: string;
  type: ProductType;
  industries: string[];
  scenarios: string[];
  description: string;
  createTime: string;
}

export interface SurveyForm {
  id: string;
  name: string;
  customerName: string;
  projectName: string;
  industry: string;
  region: string;
  templateId: string;
  status: SurveyStatus;
  reportStatus: ReportStatus;
  creator: string;
  submitter?: string;
  preSalesResponsible?: string;
  createTime: string;
  data: Record<string, any>;
}

export interface SurveyTemplate {
  id: string;
  name: string;
  industry: string;
  sections: SurveySection[];
  createTime: string;
}

export interface SurveySection {
  id: string;
  title: string;
  fields: SurveyField[];
}

export interface SurveyField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea';
  options?: string[];
  required?: boolean;
}

export interface PreSalesRegion {
  id: string;
  name: string;
  createTime: string;
}

export interface PreSalesIndustry {
  id: string;
  name: string;
  createTime: string;
}

export interface PreSalesAssignment {
  id: string;
  userId: string;
  userName: string;
  regionIds: string[];
  industryIds: string[];
  createTime: string;
}

export interface SystemLog {
  id: string;
  operator: string;
  type: LogType;
  content: string;
  time: string;
  ip: string;
  result: OperationResult;
}

export interface Message {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'report';
  time: string;
  read: boolean;
  cleared?: boolean;
  targetRole?: string;
  targetUserId?: string;
  projectId?: string;
}

export interface DashboardStats {
  customerCount: number;
  projectCount: number;
  formCount: number;
  completionRate: number;
  reportCount: number;
  reportViewRate: number;
}
