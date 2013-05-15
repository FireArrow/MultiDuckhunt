#ifdef PROFILING
struct timeval profile_before, profile_after;

#define PROFILING_PRO_STAMP() gettimeofday(&profile_before, NULL);

#define PROFILING_POST_STAMP(func) gettimeofday(&profile_after, NULL); \
    timeval_subtract(&profile_before, &profile_after, &profile_before); \
    printf("%s took %ld.%06ld s\n", func, (long)profile_before.tv_sec, (long)profile_before.tv_usec);

#else

#define PROFILING_PRO_STAMP()
#define PROFILING_POST_STAMP(x)

#endif
