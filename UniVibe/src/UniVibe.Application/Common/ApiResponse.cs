namespace UniVibe.Application.Common
{
    public class ApiResponse<T>
    {
        public T? Data { get; set; }
        public string? Message { get; set; } 
        public List<string>? Errors { get; set; }
        public bool IsSuccessful { get; set; }

        public static ApiResponse<T> Success(T data, string? message = null)
        {
            return new ApiResponse<T> { Data = data, Message = message, IsSuccessful = true };
        }

        public static ApiResponse<T> Success(string message)
        {
            return new ApiResponse<T> { IsSuccessful = true, Message = message, Data = default };
        }

        public static ApiResponse<T> Fail(string error)
        {
            return new ApiResponse<T> { Errors = new List<string> { error }, IsSuccessful = false };
        }

        public static ApiResponse<T> Fail(List<string> errors)
        {
            return new ApiResponse<T> { Errors = errors, IsSuccessful = false };
        }
    }
}