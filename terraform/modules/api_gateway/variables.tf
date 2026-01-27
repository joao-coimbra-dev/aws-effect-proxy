variable "api_name" {
  description = "The name of the API Gateway API."
  type        = string
}

variable "integrations" {
  description = "A map of integration configurations, where the key is a logical name (e.g., 'users_integration')."
  type = map(object({
    lambda_invoke_arn    = string
    lambda_function_name = string
  }))
}

variable "routes" {
  description = "A map where keys are route keys (e.g., 'GET /users') and values are the logical names of the integrations to connect to."
  type        = map(string)
}