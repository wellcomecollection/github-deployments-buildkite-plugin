output "secret_access_policy_document_json" {
  value = data.aws_iam_policy_document.secrets_access.json
}
