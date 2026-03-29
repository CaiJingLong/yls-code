export interface CodexInfoResponse {
  code: number;
  msg: string;
  state: {
    toDay: string;
    user: {
      uid: string;
      email: string;
    };
    package: {
      total_quota: number;
      packages: Array<{
        _id: string;
        uid: string;
        order_id: string;
        sub_type: string;
        package_type: string;
        amount: number;
        package_level: number;
        package_quota: number;
        duration: number;
        start_at: string;
        expires_at: string;
        is_refundable: boolean;
        package_status: string;
        is_deleted: boolean;
        remark: string;
        createdAt: string;
        updatedAt: string;
      }>;
      cache: boolean;
      package_level: number;
    };
    userPackgeUsage: {
      input_tokens: number;
      input_tokens_cached: number;
      output_tokens: number;
      output_tokens_reasoning: number;
      total_tokens: number;
      input_cost: number;
      output_cost: number;
      cache_read_cost: number;
      total_cost: number;
      request_count: number;
      total_quota: number;
      remaining_quota: number;
      used_percentage: string;
    };
    userAccountInfo: {
      total_balance: number;
      accountId: string | null;
    };
  };
}

export interface CodexLogItem {
  _id: string;
  type: string;
  model: string;
  reasoning: string;
  input_tokens: number;
  input_tokens_cached: number;
  input_cache_creation_tokens: number;
  output_tokens: number;
  output_tokens_reasoning: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  cache_creation_cost: number;
  cache_read_cost: number;
  total_cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodexLogsResponse {
  code: number;
  msg: string;
  data: {
    items: CodexLogItem[];
    page: number;
    page_size: number;
    total: number;
  };
}
