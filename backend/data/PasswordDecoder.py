import base64

class PasswordDecoder:
    @staticmethod
    def encode(password: str):
        bytes_str = password.encode("utf-8")
        return base64.b64encode(bytes_str).decode("utf-8")

    @staticmethod
    def decode(password: str):
        decoded_bytes = base64.b64decode(password)
        return decoded_bytes.decode("utf-8")
