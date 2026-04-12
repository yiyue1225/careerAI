import os
from dotenv import load_dotenv
from careerAI.backend.data.PasswordDecoder import PasswordDecoder

env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)



def decode(password: str):
    return PasswordDecoder.decode(password)

def main():
    cipher = os.getenv("DIFY_PASSWORD_CIPHER")
    plain = decode(cipher)
    print(plain)

if __name__ == "__main__":
    main()