import zerorpc


class StreamAPI:
    @zerorpc.stream
    def stream(self, start, end, step):
        return range(start, end, step)


s = zerorpc.Server(StreamAPI())
s.bind("tcp://0.0.0.0:4242")
s.run()
