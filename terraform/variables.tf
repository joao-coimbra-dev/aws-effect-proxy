variable "aws_region" {
  description = "AWS region to deploy to"
  type = string
  default     = "eu-north-1"
}

variable "target_url" {
  description = "The target URL for the proxy Lambda function"
  type        = string
  default     = "https://jsonplaceholder.typicode.com" # Provide a default or make it required
}

variable "dynamodb_table_name" {
  description = "The name for the DynamoDB users table"
  type        = string
  default     = "users-table"
}