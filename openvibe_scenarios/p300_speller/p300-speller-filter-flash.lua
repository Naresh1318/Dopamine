
-- Picks out 'flashes' from a stimulation stream

-- this function is called when the box is initialized
function initialize(box)

	dofile(box:get_config("${Path_Data}") .. "/plugins/stimulation/lua-stimulator-stim-codes.lua")
	
	box:set_filter_mode(1);
	
	state = 0
	
	do_debug = false
end

-- this function is called when the box is uninitialized
function uninitialize(box)
end

-- this function is called once by the box
function process(box)

	-- loop until box:keep_processing() returns zero
	-- cpu will be released with a call to sleep
	-- at the end of the loop
	while box:keep_processing() do

		-- gets current simulated time
		t = box:get_current_time()

		-- loops on every received stimulation for a given input
		for stimulation = 1, box:get_stimulation_count(1) do

			-- gets stimulation
			stimulation_id, stimulation_time, stimulation_duration = box:get_stimulation(1, 1)

			if stimulation_id == OVTK_StimulationId_SegmentStart then
				state = 1
			elseif stimulation_id == OVTK_StimulationId_SegmentStop then
				state = 0
			end

			-- If we're between 'rest start' and 'rest_stop', this specifies a target
			if state == 1 and stimulation_id >= OVTK_StimulationId_LabelStart and stimulation_id <= OVTK_StimulationId_LabelEnd then
			
				box:send_stimulation(1, stimulation_id, stimulation_time, 0)

				if do_debug then	
					box:log("Info", string.format("Push a target %d at %f (now %f)", stimulation_id, stimulation_time, t))		
				end						
			end
			
			-- discards it
			box:remove_stimulation(1, 1)

		end

		-- releases cpu
		box:sleep()
	end
end
