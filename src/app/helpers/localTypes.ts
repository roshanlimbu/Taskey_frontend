export interface MenuItem {
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
  permission?: string;
  expanded?: boolean;
  active?: boolean;
}

export interface  Permission {
  code: string;
  name: string;
}



export interface customHttpError {
  reason: string;
  error_type: string;
}

export interface TitleLink {
  title: string;
  link: string;
  queryParams?: any | null;
  active: boolean;
}
