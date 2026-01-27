variable "table_name" {
  description = "The name of the DynamoDB table."
  type        = string
}

variable "hash_key" {
  description = "The attribute to use as the hash key for the table."
  type        = string
  default     = "id"
}
