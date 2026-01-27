variable "user_pool_name" {
  description = "The name of the Cognito User Pool"
  type        = string
}

variable "client_name" {
  description = "The name of the Cognito User Pool Client"
  type        = string
}

variable "define_auth_challenge_arn" {
  description = "The ARN of the Define Auth Challenge Lambda function"
  type        = string
  default     = null
}

variable "create_auth_challenge_arn" {
  description = "The ARN of the Create Auth Challenge Lambda function"
  type        = string
  default     = null
}

variable "verify_auth_challenge_arn" {
  description = "The ARN of the Verify Auth Challenge Lambda function"
  type        = string
  default     = null
}

