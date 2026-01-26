variable "aws_region" {
  description = "AWS region to deploy to"
  type = string
  default     = "eu-north-1"
}

variable "target_url" {
  description = "The URL to which the proxy will forward requests."
  type        = string
  default     = "https://jsonplaceholder.typicode.com"
}

variable "cognito_user_pool_name" {
  description = "The name for the Cognito User Pool."
  type        = string
  default     = "auth-pool"
}

variable "cognito_client_name" {
  description = "The name for the Cognito User Pool Client."
  type        = string
  default     = "auth-client"
}


variable "dynamodb_table_name" {
  description = "The name for the DynamoDB users table"
  type        = string
  default     = "users-table"
}