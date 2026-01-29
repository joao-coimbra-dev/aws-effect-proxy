variable "function_name" {
  description = "The name of the Lambda function."
  type        = string
}

variable "timeout" {
  description = "The timeout for the Lambda function."
  type        = number
  default     = 10
}

variable "memory_size" {
  description = "The memory size for the Lambda function."
  type        = number
  default     = 128
}

variable "environment_variables" {
  description = "A map of environment variables for the Lambda function."
  type        = map(string)
  default     = {}
}

variable "dlq_target_arn" {
  description = "The ARN of the SQS queue to use as a Dead Letter Queue."
  type        = string
  default     = null
}

variable "additional_policy" {
  description = "An additional IAM policy document to attach to the Lambda's role."
  type        = string
  default     = null
}

variable "image_uri" {
  description = "The URI of the Docker image for the Lambda function."
  type        = string
}

variable "handler" {
  description = "The handler for the Lambda function."
  type        = string
}

